import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /chat — start a dialogue over the selected sources.
export default class CreateChatDto extends BaseDto {
  static schema = z.object({
    sourceIds: z.array(z.string()).min(1, "At least one source is required"),
    title: z.string().max(200).optional().nullable(),
  });
}
