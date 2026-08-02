import { expect, test } from "vitest";
import { verifyAlmanpediaDeployment } from "../../scripts/verify-almanpedia-deployment";

const ROOT_HTML = `<!doctype html>
<link rel="stylesheet" href="/assets/app.css">
<script src="/reader-settings.js"></script>
<script type="module" src="/assets/app.js"></script>
<div id="app"></div>`;

const MAIN_SCRIPT = 'new Worker(new URL("/assets/translate-worker-worker.js", import.meta.url));';

function contentType(path: string): string {
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".wasm")) return "application/wasm";
  return "application/javascript";
}

function deploymentFetch(options: { missingStatus?: number } = {}) {
  const calls: Array<{ method: string; url: URL }> = [];
  const fetchImpl = async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    calls.push({ method, url });

    if (url.pathname.includes("alman-deploy-missing-")) {
      const status = options.missingStatus ?? 404;
      return new Response(method === "HEAD" ? null : status === 404 ? "missing" : ROOT_HTML, {
        status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": status === 404 ? "no-store" : "public, max-age=31536000, immutable",
        },
      });
    }
    if (url.pathname === "/") {
      return new Response(method === "HEAD" ? null : ROOT_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (url.pathname === "/wiki/Spanische_Niederlande") {
      return new Response(method === "HEAD" ? null : ROOT_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const body = url.pathname === "/assets/app.js" ? MAIN_SCRIPT : "asset";
    return new Response(method === "HEAD" ? null : body, {
      status: 200,
      headers: { "Content-Type": contentType(url.pathname) },
    });
  };
  return { calls, fetchImpl: fetchImpl as typeof fetch };
}

function deterministicNonce(): () => string {
  let value = 0;
  return () => String(++value);
}

test("deployment verification waits for safe probes before canonical asset requests", async () => {
  const mock = deploymentFetch();
  const logs: string[] = [];

  await verifyAlmanpediaDeployment({
    baseUrl: "https://example.test/",
    attempts: 2,
    consecutiveReadyRounds: 2,
    delayMs: 0,
    fetchImpl: mock.fetchImpl,
    sleep: async () => {},
    log: (message) => logs.push(message),
    nonce: deterministicNonce(),
  });

  const canonicalAssets = mock.calls.filter(({ url }) =>
    !url.search && !url.pathname.includes("alman-deploy-missing-") && (
      url.pathname.startsWith("/assets/")
      || url.pathname.startsWith("/ort/")
      || url.pathname === "/reader-settings.js"
    ));
  expect(canonicalAssets.map(({ url }) => url.pathname).sort()).toEqual([
    "/assets/app.css",
    "/assets/app.js",
    "/assets/translate-worker-worker.js",
    "/ort/ort-wasm-simd-threaded.asyncify.mjs",
    "/ort/ort-wasm-simd-threaded.asyncify.wasm",
    "/reader-settings.js",
  ]);
  for (const { url } of canonicalAssets) {
    const safeProbes = mock.calls.filter((call) => call.url.pathname === url.pathname && call.url.search);
    expect(safeProbes.length, url.pathname).toBeGreaterThanOrEqual(2);
  }
  expect(logs.at(-1)).toContain("missing-asset 404s");
});

test("an SPA fallback on a missing asset blocks canonical asset verification", async () => {
  const mock = deploymentFetch({ missingStatus: 200 });

  await expect(verifyAlmanpediaDeployment({
    baseUrl: "https://example.test/",
    attempts: 2,
    consecutiveReadyRounds: 1,
    delayMs: 0,
    fetchImpl: mock.fetchImpl,
    sleep: async () => {},
    log: () => {},
    nonce: deterministicNonce(),
  })).rejects.toThrow("deployment did not become safe");

  expect(mock.calls.some(({ url }) => !url.search && url.pathname.startsWith("/assets/app"))).toBe(false);
});
