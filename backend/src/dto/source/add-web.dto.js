import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /source/web — add a web page as a source.
export default class AddWebDto extends BaseDto {
  static schema = z.object({
    url: z.string().url("Enter a valid URL"),
  });
}
