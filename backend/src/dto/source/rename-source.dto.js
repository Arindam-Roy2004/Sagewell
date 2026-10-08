import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// PATCH /source/:sourceId — rename a source.
export default class RenameSourceDto extends BaseDto {
  static schema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
  });
}
