import mongoose, { Schema } from "mongoose";

const sourceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["pdf", "csv", "link", "text", "docx", "text-paste"],
      required: true,
    },
    status: {
      type: String,
      enum: ["uploading", "queued", "processing", "completed", "failed", "deleting"],
      default: "uploading",
    },
    s3Key: {
      type: String,
      default: null,
    },
    originalFileName: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },
    summary: {
      type: String,
      default: null,
    },
    textContent: {
      type: String,
      default: null,
    },
    webURL: {
      type: String,
      default: null,
    },
    rawURL: {
      type: String,
      default: null,
    },
    totalParentChunks: {
      type: Number,
      default: 0,
    },
    totalChildChunks: {
      type: Number,
      default: 0,
    },
    totalPages: {
      type: Number,
      default: 1,
    },
    // Credits held for processing this source (micro-USD). `settled` makes the final
    // charge / refund idempotent; see shared/libs/credits.js.
    credit: {
      reserved: { type: Number, default: 0 },
      settled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

sourceSchema.index({ userId: 1, createdAt: -1 });
sourceSchema.index({ userId: 1, status: 1 });

const Source = mongoose.model("Source", sourceSchema);

export default Source;
