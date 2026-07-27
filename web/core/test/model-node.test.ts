/**
 * Real-model parity gate (opt-in: MODEL_IT=1, requires ALMAN_MODEL_DIR to
 * point at a local copy of the GoePT-1-20M package root).
 *
 * Runs the pinned @huggingface/transformers adapter over onnxruntime-node and
 * asserts exact output equality with predictions sampled from the frozen
 * browser evaluation of the qualified artifact. A failure means version skew
 * between the npm runtime and the qualified bundle.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { outputTokenBudget } from "../src/engine/validation";
import { GENERATION_PARAMS, MODEL_PACKAGE } from "../src/model/manifest";

interface ModelCase {
  id: string;
  collection: string;
  source: string;
  expected: string;
}

const enabled = process.env.MODEL_IT === "1";

describe.runIf(enabled)("model parity (onnxruntime-node)", () => {
  const modelDir = process.env.ALMAN_MODEL_DIR ?? "";

  const cases: ModelCase[] = readFileSync(new URL("./fixtures/model_cases.jsonl", import.meta.url), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  test("ALMAN_MODEL_DIR points at the package root", () => {
    expect(modelDir, "MODEL_IT=1 requires ALMAN_MODEL_DIR=<GoePT package root>").not.toBe("");
  });

  test("local package matches the pinned manifest digests", () => {
    for (const file of MODEL_PACKAGE.files) {
      const bytes = readFileSync(join(modelDir, file.path));
      expect(bytes.byteLength, file.path).toBe(file.bytes);
      expect(createHash("sha256").update(bytes).digest("hex"), file.path).toBe(file.sha256);
    }
  });

  test("translations match the frozen browser predictions exactly", { timeout: 600_000 }, async () => {
    const { env, pipeline } = await import("@huggingface/transformers");
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = modelDir;
    const pipe = (await pipeline("text2text-generation", "model", {
      dtype: "q8",
      local_files_only: true,
    })) as unknown as {
      (
        text: string,
        params: Omit<typeof GENERATION_PARAMS, "max_new_tokens"> & { max_new_tokens: number },
      ): Promise<Array<{ generated_text: string }>>;
      tokenizer: (text: string) => { input_ids: { dims: number[] } };
      dispose(): Promise<void>;
    };

    try {
      const tokens = Number(pipe.tokenizer(cases[0]?.source ?? "Ja.").input_ids.dims.at(-1) ?? 0);
      expect(Number.isInteger(tokens)).toBe(true);
      expect(tokens).toBeGreaterThan(0);

      expect(cases).toHaveLength(12);
      for (const item of cases) {
        const sourceTokens = Number(pipe.tokenizer(item.source).input_ids.dims.at(-1) ?? 0);
        const [output] = await pipe(item.source, {
          ...GENERATION_PARAMS,
          max_new_tokens: outputTokenBudget(sourceTokens),
        });
        expect(output?.generated_text, `${item.id} (${item.collection})`).toBe(item.expected);
      }
    } finally {
      await pipe.dispose();
    }
  });
});

describe.runIf(!enabled)("model parity (skipped)", () => {
  test.skip("set MODEL_IT=1 with ALMAN_MODEL_DIR to run the parity gate", () => {});
});
