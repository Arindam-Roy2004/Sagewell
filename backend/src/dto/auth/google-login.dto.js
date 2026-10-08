import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /auth/google — the ID token ("credential") returned by Google Identity Services.
export default class GoogleLoginDto extends BaseDto {
  static schema = z.object({
    credential: z.string().min(1, "Google credential is required"),
  });
}
