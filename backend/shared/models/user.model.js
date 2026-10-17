import mongoose, { Schema } from "mongoose";
import { STARTING_CREDITS, toMicros } from "../libs/pricing.js";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Optional for accounts created through Google sign-in.
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    facts: {
      type: [String],
      default: [],
    },
    // Model usage budget, in micro-USD (see shared/libs/pricing.js). Accounts created before
    // credits existed have no stored value; shared/libs/credits.js initialises them on first use.
    credits: {
      granted: { type: Number, default: () => toMicros(STARTING_CREDITS) },
      balance: { type: Number, default: () => toMicros(STARTING_CREDITS) },
      spent: { type: Number, default: 0 },
    },
    // Activity, for the admin dashboard (shared/libs/activity.js).
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
    // Lifetime counters used by hard per-account limits.
    usage: {
      urlSources: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ lastActiveAt: -1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
