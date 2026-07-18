import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

// --- Mock @google/genai BEFORE importing the app ---------------------------
const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  Type: {
    OBJECT: "OBJECT",
    STRING: "STRING",
    ARRAY: "ARRAY",
    INTEGER: "INTEGER",
  },
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

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
    foodAndDrink:  { cost: "$60/day",    style: "izakayas and ramen shops" },
    transportation:{ cost: "$10/day",    style: "metro pass" },
    activities:    { cost: "$40/day",    style: "temple entry, museum passes" },
    totalCost: "$1,000",
  },
  dayWiseItinerary: [
    {
      dayNumber: 1,
      theme: "Historical Hearts & Hidden Cafes",
      paceLevel: "Medium",
      timeline: {
        morning:   { activity: "Visit Senso-ji", location: "Asakusa",  tip: "Arrive early" },
        afternoon: { activity: "Lunch + stroll",  location: "Ueno",    tip: "Try soba"     },
        evening:   { activity: "Dinner + izakaya",location: "Shinjuku",tip: "Book ahead"   },
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

// ── Import app AFTER mocks ───────────────────────────────────────────────────
import { app } from "./server";

// ── Test suite ───────────────────────────────────────────────────────────────

describe("POST /api/generate-itinerary", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });

  // ── Required-field validation ─────────────────────────────────────────────

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ destination: "Paris" }); // missing vibe / duration / budgetLevel / travelParty

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing required fields/i);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 400 when vibe is missing but other fields are present", async () => {
    const { vibe, ...noVibe } = validPayload;
    const res = await request(app).post("/api/generate-itinerary").send(noVibe);

    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 400 when vibe is an empty string", async () => {
    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, vibe: "   " }); // whitespace-only

    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 400 when duration is missing", async () => {
    const { duration, ...noDuration } = validPayload;
    const res = await request(app).post("/api/generate-itinerary").send(noDuration);

    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 400 when duration is a non-numeric string", async () => {
    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, duration: "five" });

    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 400 when budgetLevel is missing", async () => {
    const { budgetLevel, ...noBudget } = validPayload;
    const res = await request(app).post("/api/generate-itinerary").send(noBudget);

    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 400 when travelParty is missing", async () => {
    const { travelParty, ...noParty } = validPayload;
    const res = await request(app).post("/api/generate-itinerary").send(noParty);

    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns 400 when body is completely empty", async () => {
    const res = await request(app).post("/api/generate-itinerary").send({});

    expect(res.status).toBe(400);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  // ── Successful generation ─────────────────────────────────────────────────

  it("returns the generated itinerary on valid input", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(fakeItinerary) });

    const res = await request(app).post("/api/generate-itinerary").send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.recommendedDestination.city).toBe("Tokyo");
    expect(res.body.dayWiseItinerary).toHaveLength(1);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("works without the optional destination field", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(fakeItinerary) });

    const { destination, ...withoutDestination } = validPayload;
    const res = await request(app).post("/api/generate-itinerary").send(withoutDestination);

    expect(res.status).toBe(200);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("works when interests is an empty array", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, interests: [] });

    expect(res.status).toBe(200);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).toMatch(/broad interests/i);
  });

  it("works when interests field is omitted entirely", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    const { interests, ...noInterests } = validPayload;
    const res = await request(app).post("/api/generate-itinerary").send(noInterests);

    expect(res.status).toBe(200);
  });

  // ── Prompt content assertions ─────────────────────────────────────────────

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

  it("clamps duration to maximum of 14 days", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, duration: 999 });

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    // The clamped duration (14) should appear in the prompt
    expect(callArgs.contents).toContain("14");
  });

  it("clamps duration to minimum of 1 day", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, duration: -5 });

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).toContain("1");
  });

  it("strips control characters from vibe input", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, vibe: "nice\x00trip\x1Fplan" });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents).not.toContain("\x00");
    expect(callArgs.contents).not.toContain("\x1F");
  });

  // ── Error handling ────────────────────────────────────────────────────────

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

  it("returns 200 with an empty object when Gemini returns empty text", async () => {
    mockGenerateContent.mockResolvedValue({ text: "" });

    const res = await request(app).post("/api/generate-itinerary").send(validPayload);

    // The server falls back to JSON.parse("{}") when text is falsy — returns 200
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it("returns 500 with a clear message when GEMINI_API_KEY is missing", async () => {
    vi.resetModules();
    delete process.env.GEMINI_API_KEY;

    const { app: freshApp } = await import("./server");
    const res = await request(freshApp).post("/api/generate-itinerary").send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/GEMINI_API_KEY/);
  });

  // ── Security response headers ─────────────────────────────────────────────

  it("includes security headers in all responses", async () => {
    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ destination: "Paris" }); // triggers 400, but headers should still be present

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-xss-protection"]).toBe("1; mode=block");
  });

  // ── sanitiseString (tested indirectly via the API) ────────────────────────

  it("accepts and processes a destination that is exactly at the max length", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    // 120 chars — exactly the limit
    const longDest = "A".repeat(120);
    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, destination: longDest });

    expect(res.status).toBe(200);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    // The destination should appear in the prompt, not exceed 120 chars
    expect(callArgs.contents).toContain(longDest);
  });

  it("strips control characters from budgetLevel and still validates correctly", async () => {
    mockGenerateContent.mockResolvedValue({ text: "{}" });

    // budgetLevel with injected control chars — sanitised to "mid-range"
    const res = await request(app)
      .post("/api/generate-itinerary")
      .send({ ...validPayload, budgetLevel: "mid\x00-\x1Frange" });

    // After stripping control chars the value is non-empty → proceeds to AI call
    expect(res.status).toBe(200);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
