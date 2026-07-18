import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// --- Mock @google/genai BEFORE importing the app ---------------------------
// server.ts lazily creates one GoogleGenAI client and caches it as a module
// singleton, so we share a single mockGenerateContent fn across the mock
// factory and reset it between tests instead of re-mocking the constructor.
const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    // Only the members server.ts actually references from Type are needed
    // here — they're just used as schema markers, so plain strings are fine.
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
      ARRAY: "ARRAY",
      INTEGER: "INTEGER",
    },
  };
});

const validPayload = {
  destination: "Tokyo",
  vibe: "relaxing culture trip",
  duration: 3,
  budgetLevel: "mid-range",
  travelParty: "couple",
  interests: ["food", "temples"],
};

const fakeItinerary = {
  recommendedDestination: { city: "Tokyo", country: "Japan" },
  vibeMatch: "Tokyo blends serene temples with a relaxed food scene.",
  budgetEstimate: {
    accommodation: { cost: "$150/night", style: "boutique hotel" },
    foodAndDrink: { cost: "$60/day", style: "izakayas and ramen shops" },
    transportation: { cost: "$10/day", style: "metro pass" },
    activities: { cost: "$40/day", style: "temple entry, museum passes" },
    totalCost: "$1,000",
  },
  dayWiseItinerary: [
    {
      dayNumber: 1,
      theme: "Historical Hearts & Hidden Cafes",
      paceLevel: "Medium",
      timeline: {
        morning: { activity: "Visit Senso-ji", location: "Asakusa", tip: "Arrive early" },
        afternoon: { activity: "Lunch + stroll", location: "Ueno", tip: "Try soba" },
        evening: { activity: "Dinner + izakaya", location: "Shinjuku", tip: "Book ahead" },
      },
      hiddenGem: { name: "Yanaka Ginza", description: "A quiet old-town shopping street." },
    },
  ],
  localInsights: {
    culturalEtiquette: ["Remove shoes indoors", "Don't tip"],
    tippingAndCurrency: "Cash is preferred; tipping isn't customary.",
    safetyScamAlert: "Very low crime; watch for overpriced tourist bars.",
  },
  packingChecklist: {
    essentials: ["Passport", "IC card"],
    clothingVibe: "Smart casual, comfortable walking shoes",
    gearTech: ["Universal adapter", "Portable charger"],
  },
};

// --- Import the app AFTER mocks are declared --------------------------------
// This requires server.ts to `export { app }` and to guard `startServer()`
// with something like `if (process.env.NODE_ENV !== "test") startServer();`
// so importing it in tests doesn't try to boot Vite middleware or listen on
// a real port. See note at the bottom of this file for the exact diff.
import { app } from "./server";

describe("POST /api/generate-itinerary", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ destination: "Paris" }); // missing vibe/duration/budgetLevel/travelParty

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing required fields/i);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns the generated itinerary on valid input", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(fakeItinerary) });

    const res = await request(app).post("/api/generate-itinerary").send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.recommendedDestination.city).toBe("Tokyo");
    expect(res.body.dayWiseItinerary).toHaveLength(1);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("focuses the prompt on the given destination when one is provided", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    await request(app).post("/api/generate-itinerary").send(validPayload);

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).toContain("Tokyo");
    expect(callArgs.model).toBe("gemini-3.5-flash");
  });

  it("asks the model to recommend a destination when none is specified", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    const { destination, ...withoutDestination } = validPayload;
    await request(app).post("/api/generate-itinerary").send(withoutDestination);

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).toMatch(/recommend the perfect city/i);
  });

  it("falls back to broad interests text when none are given", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    const { interests, ...withoutInterests } = validPayload;
    await request(app).post("/api/generate-itinerary").send(withoutInterests);

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).toMatch(/broad interests/i);
  });

  it("returns 500 with the error message when the Gemini call fails", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Gemini API failure"));

    const res = await request(app).post("/api/generate-itinerary").send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Gemini API failure");
  });

  it("returns 500 when the response text isn't valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({ text: "not valid json" });

    const res = await request(app).post("/api/generate-itinerary").send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  it("returns 500 with a clear message when GEMINI_API_KEY is missing", async () => {
    // Needs a fresh module instance since the Gemini client is cached as a
    // module-level singleton once created by an earlier test.
    vi.resetModules();
    delete process.env.GEMINI_API_KEY;

    const { app: freshApp } = await import("./server");
    const res = await request(freshApp).post("/api/generate-itinerary").send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/GEMINI_API_KEY/);
  });
});

/*
SETUP NOTES
============
1. Install dev dependencies:
   npm install -D vitest supertest @types/supertest

2. Add a test script to package.json:
   "scripts": {
     ...
     "test": "vitest run"
   }

3. Make server.ts testable by exporting `app` and skipping the real server
   boot (and Vite dev middleware) when running under Vitest. At the bottom
   of server.ts, replace:

     startServer();

   with:

     if (process.env.NODE_ENV !== "test") {
       startServer();
     }

     export { app };

   Vitest sets NODE_ENV to "test" automatically, so no extra config is needed.

4. Place this file as server.test.ts in your project root (next to server.ts),
   or adjust the `from "../server"` import path to wherever server.ts lives
   relative to this test file.

5. Run:
   npm test
*/
