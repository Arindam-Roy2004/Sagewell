import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// PATCH /chat/:chatId — rename a dialogue.
export default class RenameChatDto extends BaseDto {
  static schema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
  });
}
