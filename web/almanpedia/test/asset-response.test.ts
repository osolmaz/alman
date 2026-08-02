import { expect, test } from "vitest";
import { serveAssetOr404 } from "../src/cloudflare/asset-response";

test("a real static asset response passes through unchanged", async () => {
  const original = new Response("body {}", {
    status: 200,
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });

  expect(await serveAssetOr404({ next: async () => original })).toBe(original);
});

test("an SPA fallback on an asset path becomes an uncacheable 404", async () => {
  const response = await serveAssetOr404({
    next: async () => new Response('<div id="app"></div>', {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  });

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).toBe("Not Found\n");
});

test("an upstream failure is not disguised as a missing asset", async () => {
  const original = new Response("failed", {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  expect(await serveAssetOr404({ next: async () => original })).toBe(original);
});
