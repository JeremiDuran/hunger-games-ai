import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

describe("POST /api/narrative Route Handler", () => {
  const originalKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalKey;
  });

  it("returns 400 Bad Request if payload fails validation", async () => {
    const invalidReq = new NextRequest("http://localhost:3000/api/narrative", {
      method: "POST",
      body: JSON.stringify({
        participants: [], // Invalid: empty array
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(invalidReq);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("Invalid narrative event payload");
    expect(json.details).toBeDefined();
  });

  it("returns fallback text with 200 OK when OPENROUTER_API_KEY is not configured", async () => {
    const validReq = new NextRequest("http://localhost:3000/api/narrative", {
      method: "POST",
      body: JSON.stringify({
        simulationTitle: "The 74th Hunger Games",
        arenaName: "Meadow",
        eventCategory: "combat",
        outcomeType: "death",
        participants: [
          { id: "t-1", name: "Cato", district: 2 },
          { id: "t-2", name: "Thresh", district: 11 },
        ],
        stateDelta: {
          fatalities: ["t-1"],
          healthChanges: { "t-1": -50 },
          sanityChanges: {},
        },
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(validReq);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Narrative-Source")).toBe("fallback-no-key");

    const text = await res.text();
    expect(text).toContain("Meadow");
    expect(text).toContain("Cato");
    expect(text).toContain("cannon blast");
  });
});
