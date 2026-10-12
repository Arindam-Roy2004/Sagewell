import mongoose, { Schema } from "mongoose";

// Append-only history behind the credits dialog: one row per charge, refund or grant.
const creditTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["chat", "source", "refund", "grant"], required: true },
    // Micro-USD. Positive = credits spent, negative = credits returned.
    amount: { type: Number, required: true },
    label: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });
// History is a convenience, not an audit trail: drop rows after 90 days.
creditTransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model("CreditTransaction", creditTransactionSchema);
