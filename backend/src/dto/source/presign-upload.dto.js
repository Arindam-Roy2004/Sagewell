import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /source/presign — ask for a signed URL to upload a file to storage.
export default class PresignUploadDto extends BaseDto {
  static schema = z.object({
    fileName: z.string().min(1, "File name is required"),
    fileType: z.string().min(1, "File type is required"),
    fileSize: z
      .number({ invalid_type_error: "File size must be a number" })
      .positive("File size must be positive"),
  });
}
