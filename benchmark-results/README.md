# Benchmark result format

Each `*.json` file in this directory is one successful 50-item curated Alman
evaluation. The file is the compact comparison record; large Inspect logs,
server logs, smoke responses, and model weights stay outside the repository.

Human-readable comparisons may accompany result records as dated Markdown
files. They must link the exact input records and state metric direction and
the selection decision.

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
    "sample_count": 50,
    "spec_in_context": true,
    "spec_examples_in_dataset": false,
    "commit": "dec7bee",
    "working_tree_dirty": false
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
- Recorded server arguments preserve the launch shape but replace values for
  credential-bearing flags such as API keys and Hugging Face tokens with
  `<redacted>`, including non-secret local placeholders.
- Counts are authoritative. Rates and standard errors are stored for readers
  and must agree with the counts.
- Spec examples are forbidden from result records. The benchmark dataset must
  be `curated`, contain exactly 50 items, and set
  `spec_examples_in_dataset=false`.
- Unknown fields are validation errors. Version the schema before adding a
  required incompatible field.
- Records must not contain API keys, authorization headers, raw prompts, or raw
  model responses.

## Validation

```bash
uv run python -m alman.bench.results benchmark-results/<run>.json
```

Validation checks JSON Schema constraints plus cross-field rules: rates match
counts, group totals sum to 50, thinking was observed, and no memory-pressure
kill occurred.

## Loading

Tools load one JSON file, validate it against `result.schema.json`, then use
the validated snapshot. The loader does not fetch remote files or read the raw
artifact paths. Artifact locations are diagnostics and may be unavailable on
another machine.

## Boundaries

This format records evaluation provenance and outcomes. It does not contain
credentials, launch executable code, model weights, full Inspect samples, or
serving-throughput measurements.
