// Checks your S3 / R2 setup end to end, using the same client the app uses.
//
// Usage (from backend/):   bun run check:s3
//
// It writes ONE tiny test file, reads it back through a signed link, tests the browser (CORS)
// permission for your website, then deletes the test file. Cost: effectively zero.
import "../shared/libs/env.js";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../shared/libs/s3.js";

const ORIGIN = process.env.CHECK_ORIGIN || "http://localhost:5173";
const bucket = process.env.S3_BUCKET;

const missing = ["S3_Access_Key_ID", "S3_Secret_Access_Key", "S3_BUCKET"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing in backend/.env: ${missing.join(", ")}`);
  process.exit(1);
}

const region = process.env.S3_REGION || "auto";
const mode = process.env.S3_API ? `custom endpoint (${process.env.S3_API})` : "AWS endpoint";
console.log(`Bucket: ${bucket} | Region: ${region} | ${mode}\n`);

const key = `healthcheck/test-${Date.now()}.txt`;
let failed = false;
const step = async (label, fn) => {
  try {
    const detail = await fn();
    console.log(`✅ ${label}${detail ? ` — ${detail}` : ""}`);
    return true;
  } catch (err) {
    failed = true;
    console.log(`❌ ${label} — ${err.name}: ${err.message}`);
    return false;
  }
};

const uploaded = await step("Write a test file (needs s3:PutObject)", async () => {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: "sagewell s3 check", ContentType: "text/plain" }));
});

if (uploaded) {
  await step("Read it back through a signed link (needs s3:GetObject)", async () => {
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 });
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok || text !== "sagewell s3 check") throw new Error(`HTTP ${res.status}`);
  });

  await step(`Browser upload permission (CORS) for ${ORIGIN}`, async () => {
    const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: "text/plain" }), {
      expiresIn: 60,
    });
    // This is the "preflight" request a browser sends before uploading from another website.
    const res = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const allowed = res.headers.get("access-control-allow-origin");
    if (!allowed || (allowed !== "*" && allowed !== ORIGIN)) {
      throw new Error(`The bucket's CORS policy does not allow ${ORIGIN} (HTTP ${res.status}). Add it in the bucket's CORS settings.`);
    }
    return `allowed (${allowed})`;
  });

  await step("Delete the test file (needs s3:DeleteObject)", async () => {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  });
}

console.log(failed ? "\n❌ Setup is not complete. Fix the failed step(s) above." : "\n🎉 S3 is set up correctly.");
process.exit(failed ? 1 : 0);
