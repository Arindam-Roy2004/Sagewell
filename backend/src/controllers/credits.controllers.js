import User from "../../shared/models/user.model.js";
import { creditSummary, listTransactions } from "../../shared/libs/credits.js";
import { PRICING, LIMITS, ingestCostMicros, toCredits } from "../../shared/libs/pricing.js";

// GET /credits — balance, what things cost, and recent activity for the credits dialog.
export const getCredits = async (req, res) => {
  const user = await User.findById(req.user._id).select("credits usage").lean();
  const transactions = await listTransactions(req.user._id);

  return res.status(200).json({
    success: true,
    credits: creditSummary(user),
    // Typical costs, in credits, shown as a guide. Real cost follows actual usage.
    pricing: {
      chatAnswer: { from: PRICING.chatMinimum, to: PRICING.chatReserve },
      textSource: { from: Math.ceil(toCredits(ingestCostMicros(0))) },
      fileSource: { from: Math.ceil(toCredits(ingestCostMicros(0))), maxMb: Math.round(LIMITS.maxFileBytes / 1024 / 1024) },
      linkSource: { from: Math.ceil(toCredits(ingestCostMicros(0, { link: true }))), limit: LIMITS.maxUrlSources },
    },
    transactions,
  });
};
