import { z } from "zod";
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be atleast 3 characters long.").max(50, "Name is too long."),

  email: z
    .string().trim().toLowerCase().email("Invalid email"),

  password: z.string().min(12, "Password should be atleast 12 characters long").max(128, "Password is too long")
});

export const verifyOTPSchema = z.object({
  email: z
    .string().trim().email("Invalid email"),
  otp: z.string().trim().length(6)
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email."),
  password: z.string().min(12, "Password must be at least 12 characters long.")
});