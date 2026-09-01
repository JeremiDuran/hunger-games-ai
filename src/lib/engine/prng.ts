/**
 * Hunger Games AI — Deterministic Pseudo-Random Number Generator (PRNG)
 * Implements Mulberry32 with rich helper utilities for deterministic simulations and testing.
 */

/**
 * Fast 32-bit string hashing algorithm (FNV-1a 32-bit)
 * Converts arbitrary string identifiers (e.g., gameId + phaseOrder) into a 32-bit unsigned integer seed.
 */
export function hashStringToSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export interface PRNG {
  readonly seed: number;
  /** Returns a float in range [0, 1) */
  nextFloat(): number;
  /** Returns an integer in range [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Returns true with given probability [0, 1] */
  nextBoolean(probability?: number): boolean;
  /** Uniformly picks one item from a non-empty array */
  pickOne<T>(items: readonly T[]): T;
  /** Weighted pick from an array matching weights array */
  pickWeighted<T>(items: readonly T[], weights: readonly number[]): T;
  /** Pure non-mutating Fisher-Yates array shuffle */
  shuffle<T>(items: readonly T[]): T[];
  /** Derives a child deterministic seed using a salt */
  deriveSubSeed(salt: string | number): number;
}

class Mulberry32PRNG implements PRNG {
  public readonly seed: number;
  private state: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.state = this.seed;
  }

  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  }

  public nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`[PRNG] min (${min}) cannot be greater than max (${max})`);
    }
    const range = max - min + 1;
    return min + Math.floor(this.nextFloat() * range);
  }

  public nextBoolean(probability = 0.5): boolean {
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return this.nextFloat() < probability;
  }

  public pickOne<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("[PRNG] Cannot pick from an empty array");
    }
    const index = this.nextInt(0, items.length - 1);
    return items[index];
  }

  public pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0 || items.length !== weights.length) {
      throw new Error("[PRNG] items and weights must be non-empty and have matching length");
    }

    let totalWeight = 0;
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i];
      if (w < 0) {
        throw new Error(`[PRNG] weight at index ${i} cannot be negative (${w})`);
      }
      totalWeight += w;
    }

    if (totalWeight <= 0) {
      throw new Error("[PRNG] total weight must be greater than zero");
    }

    const roll = this.nextFloat() * totalWeight;
    let accumulated = 0;

    for (let i = 0; i < items.length; i++) {
      accumulated += weights[i];
      if (roll < accumulated) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  public shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  public deriveSubSeed(salt: string | number): number {
    const saltString = typeof salt === "string" ? salt : salt.toString();
    const combined = `${this.seed}:${this.nextFloat()}:${saltString}`;
    return hashStringToSeed(combined);
  }
}

/**
 * Creates a deterministic PRNG instance.
 * Accepts either an integer seed or a string seed.
 */
export function createPRNG(seedInput: number | string): PRNG {
  const seed = typeof seedInput === "string" ? hashStringToSeed(seedInput) : seedInput >>> 0;
  return new Mulberry32PRNG(seed);
}
