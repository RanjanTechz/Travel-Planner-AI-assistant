import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();

// ── Security: cap request body size to 50 KB (prevents large payload abuse) ──
app.use(express.json({ limit: "50kb" }));

// ── Security: add basic security response headers ─────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const PORT = 3000;

/** Maximum allowed lengths for user-supplied strings (security: prevent abuse) */
const MAX_DESTINATION_LEN = 120;
const MAX_VIBE_LEN = 1200;
const MAX_INTERESTS = 10;
const MAX_INTEREST_LEN = 60;

/**
 * Sanitise a string: trim whitespace and strip control characters.
 * Returns an empty string if the input is not a string.
 */
function sanitiseString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  // Remove ASCII control characters (except normal whitespace)
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLen);
}

// Lazy initialize Gemini client to prevent startup crash if key is missing
let aiClient: GoogleGenAI | null = null;

/**
 * Returns the shared GoogleGenAI client, creating it on first call.
 * Throws if GEMINI_API_KEY is not set in the environment.
 * Using lazy initialisation ensures the server can start and serve non-AI
 * routes even before the key is validated.
 */
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to generate itineraries
app.post("/api/generate-itinerary", async (req: Request, res: Response) => {
  try {
    // ── Input validation & sanitisation ────────────────────────────────────
    const destination  = sanitiseString(req.body.destination,  MAX_DESTINATION_LEN);
    const vibe         = sanitiseString(req.body.vibe,         MAX_VIBE_LEN);
    const budgetLevel  = sanitiseString(req.body.budgetLevel,  40);
    const travelParty  = sanitiseString(req.body.travelParty,  40);

    const rawDuration = req.body.duration;
    const duration = typeof rawDuration === "number" && Number.isFinite(rawDuration)
      ? Math.max(1, Math.min(14, Math.round(rawDuration)))
      : NaN;

    const rawInterests: unknown = req.body.interests ?? [];
    const interests: string[] = Array.isArray(rawInterests)
      ? rawInterests
          .slice(0, MAX_INTERESTS)
          .map((i) => sanitiseString(i, MAX_INTEREST_LEN))
          .filter(Boolean)
      : [];

    // Validate required fields after sanitisation
    if (!vibe || !budgetLevel || !travelParty || isNaN(duration)) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    const client = getAiClient();

    const interestsText = interests.length > 0 
      ? `The user's primary interests are: ${interests.join(", ")}.`
      : "The user has broad interests.";

    const destinationPrompt = destination && destination.trim() !== ""
      ? `The user has chosen to travel to: "${destination}". Focus all suggestions on this destination.`
      : `No destination was specified. Recommend the perfect city and country that matches their preferences and travel party.`;

    const systemInstruction = `You are an elite, world-class AI Travel Assistant and Expert Itinerary Planner. 
Your goal is to create a highly personalized, realistic, and deeply engaging day-by-day travel plan based on the user's preferences.

You MUST strictly adhere to the following rules:
1. Geographical Logic: Group activities by proximity. Do not make the user cross the city back and forth in a single day.
2. Pacing: Balance high-energy activities (sightseeing, walking tours) with downtime (cafes, beach relaxation, scenic drives).
3. Realism: Include estimated travel times between major activities and realistic budget numbers based on the requested tier.
4. Specific Recommendations: Provide actual names of local cafes, restaurants, neighborhoods, or attractions, rather than generic descriptions.
5. Format: Ensure the response is perfectly structured according to the defined JSON schema.

For each day, the "Hidden Gem" must be a specific, authentic, lesser-known spot away from massive tourist crowds related to that day's geography.`;

    const prompt = `Create a personalized itinerary with the following parameters:
- Destination Preference: ${destination || "Open (Recommend a perfect match)"}
- Vibe & Preferences: ${vibe}
- Duration: ${duration} days
- Budget Level: ${budgetLevel} (Adhere strictly to this cost tier in the cost breakdown)
- Travel Party: ${travelParty}
- Interests: ${interests.join(", ") || "General sightseeing, cultural experiences"}

Instructions:
1. ${destinationPrompt}
2. ${interestsText}
3. Choose a beautiful matching destination and explain why it is the perfect match (Vibe Match).
4. Provide a highly realistic and itemized budget estimate based on the requested budget tier "${budgetLevel}". Ensure the "Total Estimated Trip Cost" is equal to (accommodation per night * duration) + (food per day * duration) + transportation estimate + activities estimate. Keep values as readable strings (e.g., "$150/night for boutique hotel", "$50/day", etc.).
5. Provide a day-by-day plan for exactly ${duration} days. Each day must have a theme, a morning activity, afternoon activity (including a lunch recommendation with a local food specialty), an evening activity (including a dinner recommendation and a wind-down activity), a Hidden Gem, and a Pace Level ("Low", "Medium", "High"). Ensure consecutive days are geographically logical.
6. Provide specific Cultural Etiquette, Tipping guidelines, and a crucial Safety/Scam alert.
7. Provide a detailed Packing Checklist split into absolute essentials, clothing vibe, and gear/tech.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedDestination: {
              type: Type.OBJECT,
              properties: {
                city: { type: Type.STRING, description: "City name" },
                country: { type: Type.STRING, description: "Country name" },
              },
              required: ["city", "country"],
            },
            vibeMatch: {
              type: Type.STRING,
              description: "2-3 sentences explaining why this specific destination perfectly matches their preferences and travel party.",
            },
            budgetEstimate: {
              type: Type.OBJECT,
              properties: {
                accommodation: {
                  type: Type.OBJECT,
                  properties: {
                    cost: { type: Type.STRING, description: "Estimated cost per night or total" },
                    style: { type: Type.STRING, description: "Style, e.g. boutique hotels, hostels" },
                  },
                  required: ["cost", "style"],
                },
                foodAndDrink: {
                  type: Type.OBJECT,
                  properties: {
                    cost: { type: Type.STRING, description: "Estimated daily cost or style description" },
                    style: { type: Type.STRING, description: "Style, e.g. local street food, high-end sit down" },
                  },
                  required: ["cost", "style"],
                },
                transportation: {
                  type: Type.OBJECT,
                  properties: {
                    cost: { type: Type.STRING, description: "Estimated transportation cost" },
                    style: { type: Type.STRING, description: "Best way to get around, e.g. metro, walking, taxis" },
                  },
                  required: ["cost", "style"],
                },
                activities: {
                  type: Type.OBJECT,
                  properties: {
                    cost: { type: Type.STRING, description: "Total activities cost" },
                    style: { type: Type.STRING, description: "Description, e.g. museum passes, walking tours" },
                  },
                  required: ["cost", "style"],
                },
                totalCost: { type: Type.STRING, description: "Summed total estimated cost of the entire trip" },
              },
              required: ["accommodation", "foodAndDrink", "transportation", "activities", "totalCost"],
            },
            dayWiseItinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER, description: "Day index starting from 1" },
                  theme: { type: Type.STRING, description: "Theme of the day, e.g. Historical Hearts & Hidden Cafes" },
                  paceLevel: { type: Type.STRING, description: "Pace of the day, e.g. Low, Medium, High" },
                  timeline: {
                    type: Type.OBJECT,
                    properties: {
                      morning: {
                        type: Type.OBJECT,
                        properties: {
                          activity: { type: Type.STRING, description: "Sightseeing activity, duration, tip" },
                          location: { type: Type.STRING, description: "Specific neighborhood or landmark name" },
                          tip: { type: Type.STRING, description: "Pro traveler tip for this activity" },
                        },
                        required: ["activity", "location", "tip"],
                      },
                      afternoon: {
                        type: Type.OBJECT,
                        properties: {
                          activity: { type: Type.STRING, description: "Lunch and early afternoon activity" },
                          location: { type: Type.STRING, description: "Lunch spot name with local food specialty" },
                          tip: { type: Type.STRING, description: "Pro traveler tip for the afternoon" },
                        },
                        required: ["activity", "location", "tip"],
                      },
                      evening: {
                        type: Type.OBJECT,
                        properties: {
                          activity: { type: Type.STRING, description: "Dinner recommendation and nightlife/relaxing wind-down" },
                          location: { type: Type.STRING, description: "Dinner venue and neighborhood" },
                          tip: { type: Type.STRING, description: "Pro traveler tip for the evening" },
                        },
                        required: ["activity", "location", "tip"],
                      },
                    },
                    required: ["morning", "afternoon", "evening"],
                  },
                  hiddenGem: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Name of the off-the-beaten-path spot" },
                      description: { type: Type.STRING, description: "Description and geographic context of this local secret" },
                    },
                    required: ["name", "description"],
                  },
                },
                required: ["dayNumber", "theme", "paceLevel", "timeline", "hiddenGem"],
              },
            },
            localInsights: {
              type: Type.OBJECT,
              properties: {
                culturalEtiquette: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of dos and don'ts",
                },
                tippingAndCurrency: { type: Type.STRING, description: "Currency context, tipping norms, cash vs card" },
                safetyScamAlert: { type: Type.STRING, description: "Common scams or safety alerts to look out for" },
              },
              required: ["culturalEtiquette", "tippingAndCurrency", "safetyScamAlert"],
            },
            packingChecklist: {
              type: Type.OBJECT,
              properties: {
                essentials: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Absolute essential items",
                },
                clothingVibe: { type: Type.STRING, description: "Attire recommendation based on culture and weather" },
                gearTech: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Necessary adapters, power banks, shoes, or weather gear",
                },
              },
              required: ["essentials", "clothingVibe", "gearTech"],
            },
          },
          required: [
            "recommendedDestination",
            "vibeMatch",
            "budgetEstimate",
            "dayWiseItinerary",
            "localInsights",
            "packingChecklist",
          ],
        },
      },
    });

    const itineraryData = JSON.parse(response.text || "{}");
    res.json(itineraryData);
  } catch (error: any) {
    console.error("Error generating itinerary:", error);
    res.status(500).json({
      error: error.message || "An error occurred during itinerary generation.",
    });
  }
});

// Configure static assets or Vite middleware depending on mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app };
