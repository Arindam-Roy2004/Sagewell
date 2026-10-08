import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
});

// Login does not enforce a password length (existing accounts may predate that rule).
export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// Google sign-in: the ID token ("credential") returned by Google Identity Services in the browser.
export const googleSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});
