import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /source/confirm-upload — the browser finished uploading; start processing.
export default class ConfirmUploadDto extends BaseDto {
  static schema = z.object({
    sourceId: z.string().min(1, "Source ID is required"),
  });
}
