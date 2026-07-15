# Benchmark result format

Each `*.json` file in this directory is one successful curated Alman
evaluation after any spec-example overlaps are discarded. The file is the compact comparison record; large Inspect logs,
server logs, smoke responses, and model weights stay outside the repository.

Local vLLM records use `result.schema.json`. Hosted Hugging Face Inference
Providers records use `hosted-result.schema.json`, which records the routed
provider, hosted pricing, the thinking-call cap, and any forced-final fallback.
Direct OpenAI API records use `openai-result.schema.json`, which also separates
cached input tokens and records requested and returned model IDs.
Direct Anthropic API records use `anthropic-result.schema.json`. They record
the explicit cache policy, cache-write and cache-read tokens, hidden reasoning
tokens, and the prewarm cost.
Hosted raw samples, manifests, and per-profile result checkpoints stay in the
external artifact directory so a later profile failure does not discard an
earlier completed run.

Human-readable comparisons may accompany result records as dated Markdown
files. They must link the exact input records and state metric direction and
the selection decision.

The current 87-row leaderboard, including the 39-row dataset expansion, all
consolidated model scores, the two Bonsai variants, costs, and validation, is
in
[`2026-07-15-expanded-curated-thinking-comparison.md`](./2026-07-15-expanded-curated-thinking-comparison.md).

The complete 2026-07-11 record, including every run mode, result, token total,
cost, fallback, incident, caveat, and validation outcome, is in
[`2026-07-11-complete-thinking-benchmark-report.md`](./2026-07-11-complete-thinking-benchmark-report.md).
That report also contains the 2026-07-12 Qwen `presence_penalty=1.5`
follow-up and links its exact result record.

The additional 2026-07-12 Hugging Face Inference Providers runs for hosted
Qwen 3.6 35B, MiniMax M3, Nemotron 3 Ultra, and Step 3.7 Flash—including the
Step forced-final incident and the hosted-versus-local Qwen diagnosis—are in
[`2026-07-12-more-hf-inference-providers-thinking-comparison.md`](./2026-07-12-more-hf-inference-providers-thinking-comparison.md).

The GPT-5.4 mini and GPT-5.6 Luna/Sol/Terra xhigh runs, including cached-token
costs and the updated overall ranking, are in
[`2026-07-12-openai-xhigh-comparison.md`](./2026-07-12-openai-xhigh-comparison.md).

The same four GPT models were rerun against the updated Alman rules and the
corrected invariant-relativizer target on 2026-07-13. Results, run conditions,
costs, and the discarded initial-pass incident are in
[`2026-07-13-openai-updated-rules-comparison.md`](./2026-07-13-openai-updated-rules-comparison.md).

The Claude Sonnet 5 xhigh run, including verified cache hits, cold-cache cost,
and the discarded cache-key preflight, is in
[`2026-07-13-claude-sonnet-5-xhigh.md`](./2026-07-13-claude-sonnet-5-xhigh.md).

## Minimal shape

```json
{
  "$schema": "./result.schema.json",
  "schema_version": 1,
  "run": {
    "id": "20260711T120000Z-qwen36-35b-thinking",
    "started_at": "2026-07-11T12:00:00Z",
    "completed_at": "2026-07-11T12:20:00Z",
    "status": "success"
  },
  "benchmark": {
    "task": "alman_bench",
    "dataset": "curated",
    "raw_sample_count": 48,
    "sample_count": 48,
    "excluded_spec_example_count": 0,
    "excluded_spec_example_ids": [],
    "spec_in_context": true,
    "spec_examples_in_dataset": false,
    "commit": "dec7bee",
    "working_tree_dirty": false,
    "working_tree_changes": []
  }
}
```

Real records also require model, endpoint, runtime, generation, hardware,
memory-guard, result, and artifact metadata. See `result.schema.json` for the
complete field set.

## Rules

- `schema_version` identifies this record schema. Unsupported versions must be
  rejected.
- `run.id` must be unique and should start with a UTC basic timestamp.
- `model.repository` and `model.revision` identify immutable weights;
  `model.served_name` is only the endpoint alias.
- Thinking must be enabled and observed in at least one evaluated sample.
- `runtime.server.max_model_len` is server capacity, not measured active
  context. Actual token use belongs under `results.tokens`.
- `generation` records the resolved sampling values, even when they came from
  the model repository's `generation_config.json` rather than client flags. It
  also records the enforced reasoning-token budget; the local runner requires
  this to be smaller than the total output budget so a final answer can follow.
- Recipe provenance records the localperf source commit, file, profile, and
  every benchmark-specific deviation.
- Runtime executable, manifest, and process-guard paths must be absolute so
  preflight validation and the repository-root launch use the same files.
- Recorded server arguments preserve the launch shape but replace values for
  credential-bearing flags such as API keys and Hugging Face tokens with
  `<redacted>`, including non-secret local placeholders.
- Counts are authoritative. Rates and standard errors are stored for readers
  and must agree with the counts.
- `raw_sample_count` is the number logged by Inspect. `sample_count` is the
  number scored after discarding every source/answer pair found in the spec;
  excluded row IDs are recorded explicitly. Schema v1 fixes the known excluded
  IDs so historical records validate independently of the current checkout's
  specification. Token totals describe the raw run, including any subsequently
  excluded requests.
- New runs require a clean Git working tree. A preserved older dirty run is
  valid only when every change is identified by path and Git blob and none
  affects benchmark inputs.
- Spec examples are forbidden from result records. The benchmark dataset must
  be `curated` and set `spec_examples_in_dataset=false`. Historical complete
  records contain 48 evaluated items; current complete records contain 87.
  Partial 39-row checkpoints stay external and must not appear in a
  leaderboard.
- Unknown fields are validation errors. Version the schema before adding a
  required incompatible field.
- Records must not contain API keys, authorization headers, raw prompts, or raw
  model responses.

## Validation

Use the validator matching the record's declared `$schema`:

```bash
uv run bench-result benchmark-results/<local-run>.json
uv run bench-hf --validate benchmark-results/<hosted-run>.json
uv run bench-openai --validate benchmark-results/<openai-run>.json
uv run bench-anthropic --validate benchmark-results/<anthropic-run>.json
```

Validation checks JSON Schema constraints plus cross-field rules: raw counts
equal evaluated plus excluded rows, rates match counts, group totals match the
evaluated sample count, thinking was observed, and no memory-pressure kill
occurred.

## Loading

Tools load one JSON file, validate it against `result.schema.json`, then use
the validated snapshot. The loader does not fetch remote files or read the raw
artifact paths. Artifact locations are diagnostics and may be unavailable on
another machine.

## Boundaries

This format records evaluation provenance and outcomes. It does not contain
credentials, launch executable code, model weights, full Inspect samples, or
serving-throughput measurements.
