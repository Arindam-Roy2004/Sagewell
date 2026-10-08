import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /source/text — add pasted text as a source.
export default class AddTextDto extends BaseDto {
  static schema = z.object({
    text: z.string().min(1, "Text is required"),
  });
}
