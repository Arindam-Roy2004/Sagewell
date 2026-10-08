import "./env.js";
import { S3Client } from "@aws-sdk/client-s3";

// Works with Cloudflare R2 (the default) or AWS S3.
//   R2:  S3_API=https://<ACCOUNT_ID>.r2.cloudflarestorage.com   (S3_REGION left empty -> "auto")
//   AWS: S3_REGION=ap-south-1 (your bucket's region), S3_API left empty -> the SDK picks the AWS endpoint
export const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_API || undefined,
  credentials: {
    // Provide your R2 Access Key ID and Secret Access Key
    accessKeyId: process.env.S3_Access_Key_ID,
    secretAccessKey: process.env.S3_Secret_Access_Key,
  },
});
