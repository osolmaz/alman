import { pathToFileURL } from "node:url";
import assetGeneration from "../almanpedia/asset-generation.json" with { type: "json" };
const ORT_ASSETS = [
  `/ort/${assetGeneration.generation}/ort-wasm-simd-threaded.asyncify.mjs`,
  `/ort/${assetGeneration.generation}/ort-wasm-simd-threaded.asyncify.wasm`,
];

const DEFAULT_ARTICLE_PATH = "/wiki/Spanische_Niederlande";

export interface DeploymentVerificationOptions {
  baseUrl?: string;
  articlePath?: string;
  attempts?: number;
  consecutiveReadyRounds?: number;
  delayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
  nonce?: () => string;
}

function cacheBusted(baseUrl: URL, path: string, nonce: string): URL {
  const url = new URL(path, baseUrl);
  url.searchParams.set("alman-deploy-probe", nonce);
  return url;
}

function localAssetPaths(html: string): string[] {
  const paths = new Set<string>();
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/gu)) {
    const path = match[1];
    if (path?.startsWith("/assets/") || path === "/reader-settings.js") paths.add(path);
  }
  return [...paths];
}

function workerAssetPaths(script: string): string[] {
  return [...new Set([...script.matchAll(/["'`](\/assets\/translate-worker-[^"'`\s]+\.js)["'`]/gu)]
    .map((match) => match[1]!))];
}

function expectedMime(path: string): RegExp {
  if (path.endsWith(".css")) return /^text\/css(?:;|$)/iu;
  if (path.endsWith(".wasm")) return /^application\/wasm(?:;|$)/iu;
  if (path.endsWith(".js") || path.endsWith(".mjs")) {
    return /^(?:application|text)\/javascript(?:;|$)/iu;
  }
  throw new Error(`no expected MIME type registered for ${path}`);
}

async function assetIsReady(fetchImpl: typeof fetch, url: URL, path: string): Promise<boolean> {
  const response = await fetchImpl(url, { method: "HEAD", redirect: "error" });
  const contentType = response.headers.get("content-type") ?? "";
  return response.status === 200 && expectedMime(path).test(contentType);
}

async function deploymentRound(
  fetchImpl: typeof fetch,
  baseUrl: URL,
  nonce: () => string,
): Promise<{ ready: boolean; assets: string[] }> {
  const missingPath = `/assets/alman-deploy-missing-${nonce()}.css`;
  const missing = await fetchImpl(cacheBusted(baseUrl, missingPath, nonce()), {
    method: "HEAD",
    redirect: "error",
  });
  if (missing.status !== 404) return { ready: false, assets: [] };

  const root = await fetchImpl(cacheBusted(baseUrl, "/", nonce()), { redirect: "error" });
  if (root.status !== 200 || !(root.headers.get("content-type") ?? "").startsWith("text/html")) {
    return { ready: false, assets: [] };
  }

  const assets = new Set([...localAssetPaths(await root.text()), ...ORT_ASSETS]);
  const mainScript = [...assets].find((path) => path.startsWith("/assets/") && path.endsWith(".js"));
  if (mainScript) {
    const scriptUrl = cacheBusted(baseUrl, mainScript, nonce());
    if (!(await assetIsReady(fetchImpl, scriptUrl, mainScript))) return { ready: false, assets: [] };
    const script = await fetchImpl(cacheBusted(baseUrl, mainScript, nonce()), { redirect: "error" });
    if (script.status !== 200) return { ready: false, assets: [] };
    for (const worker of workerAssetPaths(await script.text())) assets.add(worker);
  }

  for (const path of assets) {
    if (!(await assetIsReady(fetchImpl, cacheBusted(baseUrl, path, nonce()), path))) {
      return { ready: false, assets: [] };
    }
  }
  return { ready: true, assets: [...assets] };
}

export async function verifyAlmanpediaDeployment(options: DeploymentVerificationOptions = {}): Promise<void> {
  const baseUrl = new URL(options.baseUrl ?? process.env.ALMANPEDIA_URL ?? "https://almanpedia.org/");
  const articlePath = options.articlePath ?? DEFAULT_ARTICLE_PATH;
  const attempts = options.attempts ?? 30;
  const requiredRounds = options.consecutiveReadyRounds ?? 2;
  const delayMs = options.delayMs ?? 5_000;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const log = options.log ?? console.log;
  const nonce = options.nonce ?? (() => `${Date.now()}-${crypto.randomUUID()}`);

  let readyRounds = 0;
  let assets: string[] = [];
  for (let attempt = 1; attempt <= attempts && readyRounds < requiredRounds; attempt += 1) {
    const round = await deploymentRound(fetchImpl, baseUrl, nonce);
    if (round.ready) {
      readyRounds += 1;
      assets = round.assets;
      log(`Safe asset probe ${readyRounds}/${requiredRounds} passed`);
    } else {
      readyRounds = 0;
      assets = [];
      log(`Deployment not ready (${attempt}/${attempts}); canonical assets were not requested`);
    }
    if (readyRounds < requiredRounds) await sleep(delayMs);
  }
  if (readyRounds < requiredRounds) {
    throw new Error(`deployment did not become safe after ${attempts} attempts`);
  }

  for (const path of assets) {
    const response = await fetchImpl(new URL(path, baseUrl), { method: "HEAD", redirect: "error" });
    const contentType = response.headers.get("content-type") ?? "";
    if (response.status !== 200 || !expectedMime(path).test(contentType)) {
      throw new Error(`${path} returned ${response.status} ${contentType || "without a content type"}`);
    }
  }

  const article = await fetchImpl(new URL(articlePath, baseUrl), { redirect: "error" });
  const articleHtml = await article.text();
  if (article.status !== 200 || !articleHtml.includes('id="app"') || articleHtml.includes("BESCHEID AP-404")) {
    throw new Error(`${articlePath} did not return the Almanpedia application shell`);
  }

  for (const prefix of ["/assets/", "/ort/"]) {
    const path = `${prefix}alman-deploy-missing-${nonce()}`;
    const response = await fetchImpl(new URL(path, baseUrl), { method: "HEAD", redirect: "error" });
    const cacheControl = response.headers.get("cache-control") ?? "";
    if (response.status !== 404) throw new Error(`${path} returned ${response.status}, expected 404`);
    if (/immutable|max-age=31536000/iu.test(cacheControl)) {
      throw new Error(`${path} returned an unsafe browser cache policy: ${cacheControl}`);
    }
  }

  log(`Verified ${assets.length} canonical assets, ${articlePath}, and missing-asset 404s`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyAlmanpediaDeployment();
}
