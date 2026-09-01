import { describe, it, expect } from "vitest";
import { createPRNG, hashStringToSeed } from "../prng";

describe("Deterministic PRNG (Mulberry32)", () => {
  describe("hashStringToSeed", () => {
    it("produces deterministic 32-bit unsigned integers from string inputs", () => {
      const seed1 = hashStringToSeed("game-74th-day-1");
      const seed2 = hashStringToSeed("game-74th-day-1");
      const seedDiff = hashStringToSeed("game-74th-day-2");

      expect(seed1).toBe(seed2);
      expect(seed1).not.toBe(seedDiff);
      expect(seed1).toBeGreaterThanOrEqual(0);
      expect(seed1).toBeLessThanOrEqual(0xffffffff);
    });

    it("handles empty string gracefully", () => {
      const emptySeed = hashStringToSeed("");
      expect(emptySeed).toBeGreaterThan(0);
    });
  });

  describe("createPRNG & Determinism", () => {
    it("generates identical sequence of numbers for identical seeds", () => {
      const prngA = createPRNG(42);
      const prngB = createPRNG(42);

      const sequenceA = Array.from({ length: 100 }, () => prngA.nextFloat());
      const sequenceB = Array.from({ length: 100 }, () => prngB.nextFloat());

      expect(sequenceA).toEqual(sequenceB);
    });

    it("generates different sequences for different seeds", () => {
      const prngA = createPRNG(42);
      const prngB = createPRNG(999);

      const floatA = prngA.nextFloat();
      const floatB = prngB.nextFloat();

      expect(floatA).not.toBe(floatB);
    });

    it("accepts string seed input and maintains determinism", () => {
      const prngA = createPRNG("phase-bloodbath-seed");
      const prngB = createPRNG("phase-bloodbath-seed");

      expect(prngA.nextInt(1, 100)).toBe(prngB.nextInt(1, 100));
      expect(prngA.nextFloat()).toBe(prngB.nextFloat());
    });
  });

  describe("nextInt & Bounds", () => {
    it("returns integers within [min, max] inclusive", () => {
      const prng = createPRNG(12345);
      const min = 5;
      const max = 10;

      for (let i = 0; i < 500; i++) {
        const val = prng.nextInt(min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it("returns exact value when min equals max", () => {
      const prng = createPRNG(100);
      expect(prng.nextInt(7, 7)).toBe(7);
    });

    it("throws error when min is greater than max", () => {
      const prng = createPRNG(100);
      expect(() => prng.nextInt(10, 5)).toThrowError(/cannot be greater than max/);
    });
  });

  describe("nextBoolean", () => {
    it("returns false for probability <= 0 and true for probability >= 1", () => {
      const prng = createPRNG(555);
      expect(prng.nextBoolean(0)).toBe(false);
      expect(prng.nextBoolean(-0.5)).toBe(false);
      expect(prng.nextBoolean(1)).toBe(true);
      expect(prng.nextBoolean(1.5)).toBe(true);
    });

    it("approximates expected probability over large sample", () => {
      const prng = createPRNG(777);
      const samples = 10000;
      let trueCount = 0;

      for (let i = 0; i < samples; i++) {
        if (prng.nextBoolean(0.3)) {
          trueCount++;
        }
      }

      const ratio = trueCount / samples;
      expect(ratio).toBeGreaterThan(0.27);
      expect(ratio).toBeLessThan(0.33);
    });
  });

  describe("pickOne", () => {
    it("throws error on empty array", () => {
      const prng = createPRNG(1);
      expect(() => prng.pickOne([])).toThrowError(/Cannot pick from an empty array/);
    });

    it("always picks the only element in a single-element array", () => {
      const prng = createPRNG(2);
      expect(prng.pickOne(["Katniss"])).toBe("Katniss");
    });

    it("selects elements from the array across trials", () => {
      const prng = createPRNG(3);
      const items = ["Katniss", "Peeta", "Cato", "Rue"];
      const picked = new Set<string>();

      for (let i = 0; i < 50; i++) {
        picked.add(prng.pickOne(items));
      }

      expect(picked.size).toBe(4);
    });
  });

  describe("pickWeighted", () => {
    it("throws error on mismatched lengths or empty array", () => {
      const prng = createPRNG(1);
      expect(() => prng.pickWeighted([], [])).toThrowError(/must be non-empty/);
      expect(() => prng.pickWeighted(["A", "B"], [10])).toThrowError(/matching length/);
    });

    it("throws error on negative weights or zero total weight", () => {
      const prng = createPRNG(1);
      expect(() => prng.pickWeighted(["A", "B"], [-1, 5])).toThrowError(/cannot be negative/);
      expect(() => prng.pickWeighted(["A", "B"], [0, 0])).toThrowError(/greater than zero/);
    });

    it("respects weights distribution closely", () => {
      const prng = createPRNG(9999);
      const items = ["Common", "Rare", "Legendary"];
      const weights = [80, 18, 2];
      const counts: Record<string, number> = { Common: 0, Rare: 0, Legendary: 0 };
      const N = 20000;

      for (let i = 0; i < N; i++) {
        const item = prng.pickWeighted(items, weights);
        counts[item]++;
      }

      expect(counts.Common / N).toBeGreaterThan(0.77);
      expect(counts.Common / N).toBeLessThan(0.83);

      expect(counts.Rare / N).toBeGreaterThan(0.15);
      expect(counts.Rare / N).toBeLessThan(0.21);

      expect(counts.Legendary / N).toBeGreaterThan(0.01);
      expect(counts.Legendary / N).toBeLessThan(0.035);
    });
  });

  describe("shuffle", () => {
    it("returns a new array without mutating the original", () => {
      const prng = createPRNG(123);
      const original = [1, 2, 3, 4, 5, 6, 7, 8];
      const originalCopy = [...original];

      const shuffled = prng.shuffle(original);

      expect(original).toEqual(originalCopy);
      expect(shuffled).toHaveLength(original.length);
      expect(new Set(shuffled)).toEqual(new Set(original));
    });

    it("produces deterministic shuffles", () => {
      const prng1 = createPRNG(888);
      const prng2 = createPRNG(888);
      const items = ["A", "B", "C", "D", "E", "F", "G"];

      expect(prng1.shuffle(items)).toEqual(prng2.shuffle(items));
    });
  });

  describe("deriveSubSeed", () => {
    it("generates deterministic child seeds given a salt", () => {
      const prngA = createPRNG(42);
      const prngB = createPRNG(42);

      const subSeedA = prngA.deriveSubSeed("encounter-1");
      const subSeedB = prngB.deriveSubSeed("encounter-1");

      expect(subSeedA).toBe(subSeedB);

      const subSeedOther = prngA.deriveSubSeed("encounter-2");
      expect(subSeedA).not.toBe(subSeedOther);
    });
  });
});
