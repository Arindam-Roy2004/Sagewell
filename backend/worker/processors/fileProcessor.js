import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { s3 } from "../../shared/libs/s3.js";
import { Document } from "@langchain/core/documents";
import { LIMITS } from "../../shared/libs/pricing.js";

const tooLargeError = () =>
  new Error(`This file is too large (the limit is ${Math.round(LIMITS.maxFileBytes / 1024 / 1024)}MB).`);

/** Reads a stream into memory, refusing to buffer more than `maxBytes`. */
async function streamToBuffer(stream, maxBytes) {
  const chunks = [];
  let total = 0;

  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      stream.destroy?.();
      throw tooLargeError();
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

/**
 * Downloads an uploaded file, enforcing the upload size limit here too. Uploads are size-
 * signed at presign time, but this is the last line of defence before the file is held in
 * memory: an oversized object (e.g. uploaded with an older URL) must fail the source, not
 * crash the shared worker.
 */
async function downloadFromS3(s3Key) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
  });

  const data = await s3.send(command);

  if (!data.Body) {
    throw new Error(`S3 object has no body: ${s3Key}`);
  }

  if (Number(data.ContentLength) > LIMITS.maxFileBytes) {
    data.Body.destroy?.();
    throw tooLargeError();
  }

  return streamToBuffer(data.Body, LIMITS.maxFileBytes);
}

function resolveSourceType(mimeType) {
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return "docx";
  }
  if (mimeType === "text/csv") return "csv";
  return "text";
}

export async function processFile(s3Key, mimeType, originalFileName = null) {
  console.log("🚀 Processing file from S3:", s3Key, "Type:", mimeType);

  const buffer = await downloadFromS3(s3Key);

  // Node Buffer -> Blob
  const blob = new Blob([buffer], {
    type: mimeType,
  });

  let loader;

  switch (mimeType) {
    case "application/pdf":
      loader = new PDFLoader(blob);
      break;

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      loader = new DocxLoader(blob);
      break;

    case "text/csv":
      loader = new CSVLoader(blob);
      break;

    case "text/plain":
      loader = new TextLoader(blob);
      break;

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const documents = await loader.load();
  const resolvedType = resolveSourceType(mimeType);
  const fileName = originalFileName || s3Key.split("-")[1];

  return documents.map((doc, idx) => {
    const pageNum = doc.metadata?.loc?.pageNumber || idx + 1;
    return new Document({
      pageContent: doc.pageContent,
      metadata: {
        sourceType: resolvedType,
        originalFileName: fileName,
        pageNumber: pageNum,
        url: null,
        headingHierarchy: [],
      },
    });
  });
}
