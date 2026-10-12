import { z } from "zod";
import { BaseDto } from "../base.dto.js";

// POST /admin/users/:userId/credits — add credits to an account.
export default class GrantCreditsDto extends BaseDto {
  static schema = z.object({
    credits: z.number().int("Whole credits only").min(1, "Add at least 1 credit").max(1000, "Add at most 1,000 credits at a time"),
  });
}
