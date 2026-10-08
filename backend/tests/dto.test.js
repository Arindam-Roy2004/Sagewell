// Tests for the request DTOs and the validate() middleware. Pure functions, no network.
import { describe, test, expect } from "bun:test";

import GoogleLoginDto from "../src/dto/auth/google-login.dto.js";
import CreateChatDto from "../src/dto/chat/create-chat.dto.js";
import CreateMessageDto from "../src/dto/chat/create-message.dto.js";
import RenameChatDto from "../src/dto/chat/rename-chat.dto.js";
import AddTextDto from "../src/dto/source/add-text.dto.js";
import AddWebDto from "../src/dto/source/add-web.dto.js";
import PresignUploadDto from "../src/dto/source/presign-upload.dto.js";
import ConfirmUploadDto from "../src/dto/source/confirm-upload.dto.js";
import RenameSourceDto from "../src/dto/source/rename-source.dto.js";
import { validate } from "../src/middlewares/validate.middlewares.js";
import { ValidationError } from "../shared/libs/errors.js";

describe("BaseDto.validate", () => {
  test("returns the clean value and strips unknown fields", () => {
    const { errors, value } = CreateMessageDto.validate({ message: "Hi", isAdmin: true });
    expect(errors).toBeNull();
    expect(value).toEqual({ message: "Hi" });
  });

  test("reports every problem with its field name", () => {
    const { errors, value } = PresignUploadDto.validate({ fileName: "", fileSize: -1 });
    expect(value).toBeNull();
    const fields = errors.map((e) => e.field).sort();
    expect(fields).toEqual(["fileName", "fileSize", "fileType"]);
  });

  test("treats a missing body as an empty object", () => {
    const { errors } = AddTextDto.validate(undefined);
    expect(errors).toEqual([{ field: "text", message: expect.any(String) }]);
  });
});

describe("DTO rules (unchanged from the previous validators)", () => {
  const cases = [
    [GoogleLoginDto, { credential: "token" }, { credential: "" }],
    [CreateChatDto, { sourceIds: ["a"], title: null }, { sourceIds: [] }],
    [CreateMessageDto, { message: "Hello" }, { message: "" }],
    [RenameChatDto, { title: "Notes" }, { title: "   " }],
    [AddTextDto, { text: "Some text" }, { text: "" }],
    [AddWebDto, { url: "https://example.com" }, { url: "not a url" }],
    [PresignUploadDto, { fileName: "a.pdf", fileType: "application/pdf", fileSize: 10 }, { fileName: "a.pdf", fileType: "x", fileSize: "10" }],
    [ConfirmUploadDto, { sourceId: "abc" }, { sourceId: "" }],
    [RenameSourceDto, { title: "Paper" }, { title: "x".repeat(201) }],
  ];

  for (const [Dto, good, bad] of cases) {
    test(`${Dto.name} accepts valid input and rejects invalid input`, () => {
      expect(Dto.validate(good).errors).toBeNull();
      expect(Dto.validate(bad).errors).not.toBeNull();
    });
  }

  test("rename DTOs trim the title", () => {
    expect(RenameChatDto.validate({ title: "  Notes  " }).value).toEqual({ title: "Notes" });
    expect(RenameSourceDto.validate({ title: " Paper " }).value).toEqual({ title: "Paper" });
  });
});

describe("validate() middleware", () => {
  test("replaces req.body with the clean value and calls next", () => {
    const req = { body: { message: "Hi", extra: 1 } };
    let called = false;
    validate(CreateMessageDto)(req, {}, () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(req.body).toEqual({ message: "Hi" });
  });

  test("throws a 422 ValidationError with field details", () => {
    const req = { body: {} };
    let thrown;
    try {
      validate(CreateMessageDto)(req, {}, () => {});
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(ValidationError);
    expect(thrown.statusCode).toBe(422);
    expect(thrown.details[0].field).toBe("message");
  });
});
