import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /chat/:chatId/message — send a question (answer streams back).
export default class CreateMessageDto extends BaseDto {
  static schema = z.object({
    message: z.string().min(1, "Message cannot be empty"),
  });
}
