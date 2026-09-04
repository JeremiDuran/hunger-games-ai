import { describe, it, expect } from "vitest";
import {
  getWaitingFlavorText,
  formatTributeNames,
} from "../waiting-flavor";

describe("formatTributeNames", () => {
  it("handles empty names gracefully", () => {
    expect(formatTributeNames([])).toBe("Tributes");
  });

  it("formats a single tribute", () => {
    expect(formatTributeNames(["Katniss"])).toBe("Katniss");
  });

  it("formats two tributes with 'and'", () => {
    expect(formatTributeNames(["Katniss", "Peeta"])).toBe("Katniss and Peeta");
  });

  it("formats three or more tributes with Oxford comma", () => {
    expect(formatTributeNames(["Cato", "Clove", "Marvel"])).toBe(
      "Cato, Clove, and Marvel"
    );
  });
});

describe("getWaitingFlavorText", () => {
  it("returns contextual text for combat death", () => {
    const text = getWaitingFlavorText({
      eventCategory: "combat",
      outcomeType: "death",
      participantNames: ["Cato", "Thresh"],
      eventId: "test-event-uuid-1",
    });
    expect(text).toContain("Cato and Thresh");
    expect(text).toMatch(/(clash|lethal|confrontation|life-signs|fatal|devastating)/i);
  });

  it("returns contextual text for forage loot", () => {
    const text = getWaitingFlavorText({
      eventCategory: "forage",
      outcomeType: "loot",
      participantNames: ["Rue"],
      eventId: "test-event-uuid-2",
    });
    expect(text).toContain("Rue");
    expect(text).toMatch(/(supply|cache|scavenging|resource|sustenance)/i);
  });

  it("returns contextual text for hazard wound", () => {
    const text = getWaitingFlavorText({
      eventCategory: "hazard",
      outcomeType: "wound",
      participantNames: ["Peeta"],
    });
    expect(text).toContain("Peeta");
    expect(text).toMatch(/(hazard|terrain|environmental|conditions)/i);
  });

  it("returns contextual text for sponsor loot", () => {
    const text = getWaitingFlavorText({
      eventCategory: "sponsor",
      outcomeType: "loot",
      participantNames: ["Finnick"],
    });
    expect(text).toContain("Finnick");
    expect(text).toMatch(/(parachute|patron|gift|canister)/i);
  });

  it("returns contextual text for social alliance", () => {
    const text = getWaitingFlavorText({
      eventCategory: "social",
      outcomeType: "alliance",
      participantNames: ["Katniss", "Rue"],
    });
    expect(text).toContain("Katniss and Rue");
    expect(text).toMatch(/(whisper|pact|truce|trust|clandestine)/i);
  });

  it("returns contextual text for mutt encounter", () => {
    const text = getWaitingFlavorText({
      eventCategory: "mutt",
      outcomeType: "flee",
      participantNames: ["Foxface"],
    });
    expect(text).toContain("Foxface");
    expect(text).toMatch(/(mutt|scrambling|brush|snarl)/i);
  });

  it("uses deterministic template selection when eventId is provided", () => {
    const text1 = getWaitingFlavorText({
      eventCategory: "combat",
      outcomeType: "wound",
      participantNames: ["Cato", "Marvel"],
      eventId: "fixed-uuid-abc",
    });
    const text2 = getWaitingFlavorText({
      eventCategory: "combat",
      outcomeType: "wound",
      participantNames: ["Cato", "Marvel"],
      eventId: "fixed-uuid-abc",
    });
    expect(text1).toBe(text2);
  });

  it("falls back gracefully on unknown category or outcome", () => {
    const text = getWaitingFlavorText({
      eventCategory: "unknown_category" as any,
      outcomeType: "unknown_outcome" as any,
      participantNames: ["Mystery Tribute"],
    });
    expect(text).toContain("Mystery Tribute");
  });
});
