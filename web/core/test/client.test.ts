import { expect, test } from "vitest";
import { createPortClient, type MessageTransport } from "../src/model/client";
import type { WorkerRequest, WorkerResponse } from "../src/model/protocol";

function fakeTransport() {
  const sent: WorkerRequest[] = [];
  let listener: ((message: WorkerResponse) => void) | undefined;
  const transport: MessageTransport = {
    post: (message) => sent.push(message),
    subscribe: (cb) => {
      listener = cb;
      return () => {
        listener = undefined;
      };
    },
  };
  return { transport, sent, emit: (message: WorkerResponse) => listener?.(message) };
}

test("port client correlates requests and resolves ready with progress", async () => {
  const { transport, sent, emit } = fakeTransport();
  const client = createPortClient(transport);

  const progress: number[] = [];
  const ready = client.init((p) => progress.push(p.overallLoaded));
  expect(sent[0]).toMatchObject({ type: "init" });
  emit({ type: "progress", progress: { file: "a", loaded: 1, total: 2, overallLoaded: 1, overallTotal: 2, phase: "download" } });
  emit({ type: "ready", coldStartMs: 42 });
  expect((await ready).coldStartMs).toBe(42);
  expect(progress).toEqual([1]);

  const translate = client.translate(["Hallo."]);
  const count = client.countTokens("Hallo.");
  const translateId = (sent[1] as { id: number }).id;
  const countId = (sent[2] as { id: number }).id;
  // Answer out of order; correlation must hold.
  emit({ type: "count-tokens-result", id: countId, tokens: 3 });
  emit({ type: "translate-result", id: translateId, texts: ["Hallo."] });
  expect(await count).toBe(3);
  expect(await translate).toEqual(["Hallo."]);
});

test("port client rejects the matching request on runtime error", async () => {
  const { transport, sent, emit } = fakeTransport();
  const client = createPortClient(transport);
  const ready = client.init();
  emit({ type: "ready", coldStartMs: 0 });
  await ready;

  const translate = client.translate(["Hallo."]);
  const id = (sent[1] as { id: number }).id;
  emit({ type: "error", id, name: "RuntimeError", message: "boom" });
  await expect(translate).rejects.toThrow("boom");
});
