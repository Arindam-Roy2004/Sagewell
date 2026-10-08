import { ValidationError } from "../../shared/libs/errors.js";

/**
 * Returns middleware that validates the request body against a DTO class
 * (see src/dto/base.dto.js).
 *
 * On success, req.body is replaced with the DTO's clean value (unknown fields removed,
 * transforms such as trim applied). On failure it throws a 422 with a field list.
 *
 * Usage:  router.post("/chat", validate(CreateChatDto), createChat)
 */
export const validate = (DtoClass) => (req, _res, next) => {
  const { errors, value } = DtoClass.validate(req.body);
  if (errors) {
    throw new ValidationError("Validation failed", errors);
  }
  req.body = value;
  next();
};

export default validate;
