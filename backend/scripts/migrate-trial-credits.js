/**
 * One-time migration: moves existing accounts from the old 100-credit start to the new trial
 * allowance (STARTING_CREDITS), so old users get the same lifetime allowance as new ones.
 *
 * Each account loses the difference between the old and new starting grant, from both
 * `granted` and `balance` (never below 0). Admin top-ups on top of the old grant are kept.
 * Taking it off the current balance (rather than recomputing from `spent`) keeps any credits
 * held by an in-flight chat or upload correct. Admin accounts are skipped.
 *
 * Usage:
 *   node scripts/migrate-trial-credits.js          # dry run: prints what would change
 *   node scripts/migrate-trial-credits.js --apply  # writes the changes
 *
 * Safe to run multiple times: migrated accounts are stamped with `trialCreditsMigratedAt`.
 */

import "../shared/libs/env.js";
import db from "../shared/libs/db.js";
import User from "../shared/models/user.model.js";
import { STARTING_CREDITS, toMicros, toCredits } from "../shared/libs/pricing.js";
import { userIsAdmin } from "../src/middlewares/auth.middlewares.js";

const OLD_STARTING_CREDITS = 100;

async function migrate() {
  const apply = process.argv.includes("--apply");
  const reduction = toMicros(OLD_STARTING_CREDITS - STARTING_CREDITS);
  if (reduction <= 0) {
    console.log(`STARTING_CREDITS is ${STARTING_CREDITS}, not below ${OLD_STARTING_CREDITS}. Nothing to do.`);
    process.exit(0);
  }

  await db({ minPoolSize: 1 });

  // Accounts without a stored balance get the new start on first use (credits.js), so skip them.
  // The raw collection is used so the marker field (not in the schema) is read and written as is.
  const users = await User.collection
    .find(
      { "credits.granted": { $gte: toMicros(OLD_STARTING_CREDITS) }, trialCreditsMigratedAt: { $exists: false } },
      { projection: { email: 1, role: 1, credits: 1 } },
    )
    .toArray();

  const ops = [];
  for (const user of users) {
    if (userIsAdmin(user)) {
      console.log(`  skip admin   ${user.email}`);
      continue;
    }
    const granted = user.credits.granted - reduction;
    const balance = Math.max(0, user.credits.balance - reduction);
    console.log(
      `  ${user.email}: balance ${toCredits(user.credits.balance)} → ${toCredits(balance)}, ` +
        `granted ${toCredits(user.credits.granted)} → ${toCredits(granted)}`,
    );
    ops.push({
      updateOne: {
        filter: { _id: user._id, trialCreditsMigratedAt: { $exists: false } },
        update: [
          {
            $set: {
              "credits.granted": { $subtract: ["$credits.granted", reduction] },
              "credits.balance": { $max: [0, { $subtract: ["$credits.balance", reduction] }] },
              trialCreditsMigratedAt: "$$NOW",
            },
          },
        ],
      },
    });
  }

  console.log(`\n${ops.length} account(s) to move to the ${STARTING_CREDITS}-credit trial.`);
  if (!apply) {
    console.log("Dry run. Re-run with --apply to write these changes.");
    process.exit(0);
  }
  if (ops.length) {
    const result = await User.collection.bulkWrite(ops);
    console.log(`✅ Updated ${result.modifiedCount} account(s).`);
  }
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
