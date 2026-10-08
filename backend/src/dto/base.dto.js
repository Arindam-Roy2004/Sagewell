import { z } from "zod";

/**
 * Base class for request DTOs (Data Transfer Objects).
 *
 * Each DTO declares a static zod `schema` describing one request body. `validate()`
 * checks the data, reports every problem at once, and returns a clean copy with
 * unknown fields removed (zod objects strip extra keys by default).
 *
 *   class CreateThingDto extends BaseDto {
 *     static schema = z.object({ name: z.string().min(1) });
 *   }
 *   router.post("/things", validate(CreateThingDto), controller.create);
 */
export class BaseDto {
  static schema = z.object({});

  /**
   * @param {unknown} data
   * @returns {{ errors: { field: string, message: string }[] | null, value: any }}
   */
  static validate(data) {
    const result = this.schema.safeParse(data ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));
      return { errors, value: null };
    }
    return { errors: null, value: result.data };
  }
}

export default BaseDto;
