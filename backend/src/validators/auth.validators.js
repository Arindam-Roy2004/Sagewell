import { z } from "zod";

// Google sign-in: the ID token ("credential") returned by Google Identity Services in the browser.
export const googleSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});
