import { z } from "zod";

/**
 * Regex rules for password complexity enforcement.
 */
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 72,
  UPPERCASE_REGEX: /[A-Z]/,
  LOWERCASE_REGEX: /[a-z]/,
  NUMBER_REGEX: /[0-9]/,
  SYMBOL_REGEX: /[^A-Za-z0-9]/,
  USERNAME_REGEX: /^[\p{L}\p{N}_ -]+$/u,
} as const;

export interface PasswordCriteriaState {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  metCount: number;
  isValid: boolean;
  strength: "weak" | "fair" | "strong";
}

/**
 * Real-time password criteria evaluation for live UI feedback.
 */
export function evaluatePasswordCriteria(password: string): PasswordCriteriaState {
  const hasMinLength = password.length >= PASSWORD_RULES.MIN_LENGTH;
  const hasUppercase = PASSWORD_RULES.UPPERCASE_REGEX.test(password);
  const hasLowercase = PASSWORD_RULES.LOWERCASE_REGEX.test(password);
  const hasNumber = PASSWORD_RULES.NUMBER_REGEX.test(password);
  const hasSymbol = PASSWORD_RULES.SYMBOL_REGEX.test(password);

  const criteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol];
  const metCount = criteria.filter(Boolean).length;
  const isValid = metCount === 5 && password.length <= PASSWORD_RULES.MAX_LENGTH;

  let strength: "weak" | "fair" | "strong" = "weak";
  if (metCount >= 5 && password.length >= 12) {
    strength = "strong";
  } else if (metCount >= 4) {
    strength = "fair";
  }

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    metCount,
    isValid,
    strength,
  };
}

/**
 * Base password schema enforcing uppercase, lowercase, number, and special character.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.MIN_LENGTH, { message: "passwordMinLength" })
  .max(PASSWORD_RULES.MAX_LENGTH, { message: "passwordMaxLength" })
  .regex(PASSWORD_RULES.UPPERCASE_REGEX, { message: "passwordRequiresUppercase" })
  .regex(PASSWORD_RULES.LOWERCASE_REGEX, { message: "passwordRequiresLowercase" })
  .regex(PASSWORD_RULES.NUMBER_REGEX, { message: "passwordRequiresNumber" })
  .regex(PASSWORD_RULES.SYMBOL_REGEX, { message: "passwordRequiresSymbol" });

/**
 * Email validation schema with whitespace trimming and lowercase transformation.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "emailRequired" })
  .email({ message: "invalidEmail" })
  .toLowerCase();

/**
 * Username validation schema.
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: "usernameMin" })
  .max(30, { message: "usernameMax" })
  .regex(PASSWORD_RULES.USERNAME_REGEX, { message: "usernameAlphanumeric" });

/**
 * Sign-in form schema.
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "passwordRequired" }),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Registration form schema with confirmation match refinement.
 */
export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "confirmPasswordRequired" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Upgrade guest account schema.
 */
export const upgradeGuestSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "confirmPasswordRequired" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type UpgradeGuestInput = z.infer<typeof upgradeGuestSchema>;
