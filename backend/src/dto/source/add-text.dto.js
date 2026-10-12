import { z } from "zod";
import { BaseDto } from "../base.dto.js";
import { LIMITS } from "../../../shared/libs/pricing.js";

// POST /source/text — add pasted text as a source.
export default class AddTextDto extends BaseDto {
  static schema = z.object({
    text: z
      .string()
      .min(1, "Text is required")
      .max(LIMITS.maxPastedChars, `Pasted text can be up to ${LIMITS.maxPastedChars.toLocaleString()} characters`),
  });
}
