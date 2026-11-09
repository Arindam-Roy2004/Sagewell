// Stop-generation flow: the server saves the partial answer IT generated, and /save-partial
// ignores client-supplied message content. Database, LLM, queues and retrieval are mocked.
import { describe, test, expect, mock, beforeEach } from "bun:test";
import { EventEmitter } from "events";

// ── Mocks (must be registered before the controller is imported) ────────────
const USER_ID = "64b7f0c2a1b2c3d4e5f60718";
const CHAT_ID = "64b7f0c2a1b2c3d4e5f60719";

let chatDoc; // the "database" row
const updates = []; // every findByIdAndUpdate call

function makeChatModel() {
  return {
    findById: async (id) => {
      if (!chatDoc || String(id) !== String(chatDoc._id)) return null;
      return { ...chatDoc, messages: [...chatDoc.messages], save: async () => {} };
    },
    findByIdAndUpdate: async (id, update) => {
      updates.push(update);
      if (!chatDoc) return null;
      const before = { ...chatDoc };
      const pushed = update.$push?.messages;
      if (pushed) chatDoc.messages.push(...(pushed.$each || [pushed]));
      return before;
    },
    deleteOne: async () => {
      chatDoc = null;
      return { deletedCount: 1 };
    },
    findOne: (filter) => ({
      select: () => ({
        lean: async () =>
          chatDoc && String(filter._id) === String(chatDoc._id) && String(filter.userId) === USER_ID
            ? { messages: [...chatDoc.messages] }
            : null,
      }),
    }),
  };
}

// The fake model streams two tokens, then waits until aborted and throws, like a real abort.
let streamPlan = "abort-after-two";
mock.module("../shared/libs/llm.js", () => ({
  MODELS: { main: "test", light: "test" },
  Agent: class {
    constructor(config) {
      Object.assign(this, config);
    }
  },
  run: async (_agent, _prompt, { signal } = {}) => ({
    async *toTextStream() {
      yield "Hello ";
      yield "world";
      if (streamPlan === "complete") return;
      await new Promise((resolve) => signal.addEventListener("abort", resolve, { once: true }));
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    },
  }),
}));
mock.module("../shared/models/chat.model.js", () => ({ default: makeChatModel() }));
mock.module("../shared/models/source.model.js", () => ({ default: {} }));
mock.module("../src/utils/chatContext.js", () => ({
  enqueueChatSummaryIfNeeded: async () => false,
  enqueueMemoryExtractionIfNeeded: async () => false,
  formatChatContextWithSummary: () => ({ recentMessages: [], summaryPromptBlock: "" }),
}));
mock.module("../src/utils/fetchMemory.js", () => ({
  fetchOptimizedMemory: async () => ({ userContext: "", factsText: "" }),
}));
mock.module("../src/retrieval/pipeline.js", () => ({
  retrievalPipeline: async () => ({ docs: [], metadata: {}, strategy: "HYBRID", shouldRefuse: false }),
}));
mock.module("../src/utils/traceMiddleware.js", () => ({
  createTraceSession: () => ({
    traceId: "trace-1",
    setStepDuration() {},
    setRetrievalMetrics() {},
    addEvent() {},
    complete() {},
  }),
}));

const { createMessage, stopGeneration, savePartialResponse, deleteChat } = await import(
  "../src/controllers/chat.controllers.js"
);

// ── Minimal req/res fakes ────────────────────────────────────────────────────
function fakeReq(body = {}) {
  const req = new EventEmitter();
  req.user = { _id: USER_ID, facts: [] };
  req.params = { chatId: CHAT_ID };
  req.body = body;
  return req;
}

function fakeRes() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.headersSent = false;
  res.events = [];
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.payload = payload;
    return res;
  };
  res.setHeader = () => {};
  res.flushHeaders = () => {
    res.headersSent = true;
  };
  res.write = (chunk) => {
    res.events.push(JSON.parse(String(chunk).replace(/^data: /, "")));
    return true;
  };
  res.end = () => {};
  return res;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
async function waitForTokens(res, n) {
  for (let i = 0; i < 200 && res.events.filter((e) => e.type === "token").length < n; i++) await tick();
}

beforeEach(() => {
  updates.length = 0;
  streamPlan = "abort-after-two";
  chatDoc = { _id: CHAT_ID, userId: USER_ID, sourceIds: ["s1"], messages: [], title: null };
});

describe("stopping a generation", () => {
  test("server saves the partial answer it generated; save-partial ignores client content", async () => {
    const res = fakeRes();
    const streaming = createMessage(fakeReq({ message: "What is X?" }), res);
    await waitForTokens(res, 2);

    const stopRes = fakeRes();
    await stopGeneration(fakeReq(), stopRes);
    expect(stopRes.payload.message).toBe("Generation stopped");

    // The client tries to plant fake messages; they must be ignored.
    const saveRes = fakeRes();
    await savePartialResponse(
      fakeReq({ userMessage: "FORGED user text", partialResponse: "FORGED assistant text", citations: [] }),
      saveRes
    );
    await streaming;

    expect(saveRes.statusCode).toBe(200);
    expect(saveRes.payload.messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "What is X?"],
      ["assistant", "Hello world"],
    ]);
    expect(JSON.stringify(chatDoc.messages)).not.toContain("FORGED");
    expect(updates).toHaveLength(1);
    expect(res.events.at(-1).type).toBe("stopped");
  });

  test("a completed answer is saved once and save-partial adds nothing", async () => {
    streamPlan = "complete";
    const res = fakeRes();
    await createMessage(fakeReq({ message: "Hi" }), res);
    expect(res.events.at(-1).type).toBe("done");

    const saveRes = fakeRes();
    await savePartialResponse(fakeReq({ userMessage: "Hi", partialResponse: "extra" }), saveRes);
    expect(saveRes.payload.messages.map((m) => m.content)).toEqual(["Hi", "Hello world"]);
    expect(updates).toHaveLength(1);
  });

  test("deleting the chat mid-stream saves nothing", async () => {
    const res = fakeRes();
    const streaming = createMessage(fakeReq({ message: "Q" }), res);
    await waitForTokens(res, 2);

    const original = chatDoc;
    const deleteRes = fakeRes();
    await deleteChat(fakeReq(), deleteRes);
    await streaming;

    expect(deleteRes.payload.success).toBe(true);

    expect(updates).toHaveLength(0);
    expect(original.messages).toHaveLength(0);
  });

  test("save-partial for another user's chat is refused", async () => {
    chatDoc.userId = "64b7f0c2a1b2c3d4e5f60000";
    const saveRes = fakeRes();
    await savePartialResponse(fakeReq({ userMessage: "x", partialResponse: "y" }), saveRes);
    expect(saveRes.statusCode).toBe(403);
    expect(updates).toHaveLength(0);
  });
});
