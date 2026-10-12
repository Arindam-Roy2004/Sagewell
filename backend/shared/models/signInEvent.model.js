import mongoose, { Schema } from "mongoose";

// One row per successful sign-in, for the admin dashboard's sign-in history.
const signInEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, default: "google" },
    // First sign-in, i.e. the account was created by this sign-in.
    isNewUser: { type: Boolean, default: false },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

signInEventSchema.index({ createdAt: -1 });
signInEventSchema.index({ userId: 1, createdAt: -1 });
// Keep six months of history; older rows delete themselves.
signInEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export default mongoose.model("SignInEvent", signInEventSchema);
