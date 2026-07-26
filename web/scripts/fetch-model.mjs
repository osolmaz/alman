/**
 * Downloads the pinned GoePT-1-20M model files into a local directory and
 * verifies them against the integrity manifest. Used by the CI parity job and
 * for local runs of `npm run test:model`.
 *
 *   node --experimental-strip-types web/scripts/fetch-model.mjs <target-dir>
 *
 * Set HF_TOKEN for private repos.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { MODEL_PACKAGE, assetUrl } from "../core/src/model/manifest.ts";

const target = process.argv[2];
if (!target) {
  console.error("usage: node --experimental-strip-types fetch-model.mjs <target-dir>");
  process.exit(1);
}

const headers = process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : {};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

for (const file of MODEL_PACKAGE.files) {
  const path = join(target, file.path);
  if (existsSync(path) && sha256(readFileSync(path)) === file.sha256) {
    console.log(`ok (cached) ${file.path}`);
    continue;
  }
  const url = assetUrl(file.path);
  const response = await fetch(url, { headers });
  if (!response.ok) {
    console.error(`download failed: ${url} (HTTP ${response.status})`);
    process.exit(1);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) {
    console.error(`integrity check failed: ${file.path}`);
    process.exit(1);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  console.log(`ok (downloaded) ${file.path}`);
}
console.log(`model package verified at ${target}`);
