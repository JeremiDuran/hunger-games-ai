import { describe, it, expect } from "vitest";
import {
  evaluatePasswordCriteria,
  passwordSchema,
  emailSchema,
  usernameSchema,
  registerSchema,
  signInSchema,
} from "@/lib/schemas/auth";

describe("Auth Schemas & Password Evaluation", () => {
  describe("evaluatePasswordCriteria", () => {
    it("identifies missing requirements for empty or simple passwords", () => {
      const result = evaluatePasswordCriteria("simple");
      expect(result.hasMinLength).toBe(false);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasNumber).toBe(false);
      expect(result.hasSymbol).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe("weak");
    });

    it("evaluates a valid strong password meeting all criteria", () => {
      const result = evaluatePasswordCriteria("Capitol2026!#Strong");
      expect(result.hasMinLength).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSymbol).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe("strong");
    });

    it("evaluates a valid minimum 8-character password as fair", () => {
      const result = evaluatePasswordCriteria("Panem12!");
      expect(result.hasMinLength).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.metCount).toBe(5);
      expect(result.strength).toBe("fair");
    });
  });

  describe("passwordSchema", () => {
    it("accepts valid passwords with uppercase, lowercase, digit, and symbol", () => {
      const valid = passwordSchema.safeParse("Katniss#2026");
      expect(valid.success).toBe(true);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const invalid = passwordSchema.safeParse("Kat1#");
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe("passwordMinLength");
      }
    });

    it("rejects passwords missing uppercase letters", () => {
      const invalid = passwordSchema.safeParse("katniss#2026");
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe("passwordRequiresUppercase");
      }
    });

    it("rejects passwords missing numbers", () => {
      const invalid = passwordSchema.safeParse("Katniss#Capitol");
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe("passwordRequiresNumber");
      }
    });

    it("rejects passwords missing symbols", () => {
      const invalid = passwordSchema.safeParse("Katniss2026");
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe("passwordRequiresSymbol");
      }
    });
  });

  describe("registerSchema", () => {
    it("passes when all fields are valid and passwords match", () => {
      const valid = registerSchema.safeParse({
        username: "Il Paffuto Oscuro",
        email: "President.Snow@Panem.gov",
        password: "Presidential#2026",
        confirmPassword: "Presidential#2026",
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.email).toBe("president.snow@panem.gov");
        expect(valid.data.username).toBe("Il Paffuto Oscuro");
      }
    });

    it("rejects when password and confirmPassword do not match", () => {
      const invalid = registerSchema.safeParse({
        username: "Haymitch Abernathy",
        email: "haymitch@district12.gov",
        password: "Drunken#Victor12",
        confirmPassword: "Different#Password99",
      });

      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        const mismatchIssue = invalid.error.issues.find(
          (i) => i.path.includes("confirmPassword")
        );
        expect(mismatchIssue).toBeDefined();
        expect(mismatchIssue?.message).toBe("passwordMismatch");
      }
    });

    it("rejects invalid usernames containing illegal symbols", () => {
      const invalid = registerSchema.safeParse({
        username: "Peeta Mellark!",
        email: "peeta@district12.gov",
        password: "Baker#Boy2026",
        confirmPassword: "Baker#Boy2026",
      });

      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe("usernameAlphanumeric");
      }
    });
  });

  describe("signInSchema", () => {
    it("trims and lowercases email", () => {
      const result = signInSchema.safeParse({
        email: "  GAMEMAKER@CAPITOL.PANEM  ",
        password: "AnyPassword123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("gamemaker@capitol.panem");
      }
    });
  });
});
