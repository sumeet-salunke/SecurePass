import { z } from "zod";
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be atleast 3 characters long.").max(50, "Name is too long."),

  email: z
    .email("Invalid email").trim().toLowerCase(),

  password: z.string().min(12, "Password should be atleast 12 characters long").max(128, "Password is too long")
});

export const verifyOTPSchema = z.object({
  email: z
    .email("Invalid email").trim(),
  otp: z.string().trim().length(6)
});

export const loginSchema = z.object({
  email: z.email("Invalid email.").trim().toLowerCase(),
  password: z.string().min(12, "Password must be at least 12 characters long.")
});

export const changeEmailSchema = z.object({
  currentPassword: z.string().min(12, "Password should be atleast 12 characters long.").max(128, "Password is too long"),
  newEmail: z.email("Invalid email").trim().lowercase()
});

export const verifyEmailChangeSchema = z.object({
  code: z.string().trim().length(6)
});

export const deleteAccountSchema = z.object({
  currentPassword: z.string()
    .min(12, "Password should be at least 12 characters long.").max(128, "Password is too long."),
  code: z.string().trim().optional()
});