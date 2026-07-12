# Complete thinking benchmark record — 2026-07-11

This is the durable human-readable record for the GPT-5.5 ceiling run, two
local NVFP4 runs, and four Hugging Face Inference Providers runs. The six JSON
records linked below are authoritative for machine-readable fields. The GPT-5.5
baseline predates the result schema and is sourced from its retained Inspect
log and [`docs/benchmark-results.md`](../docs/benchmark-results.md).

## Dataset and scoring

Every headline score uses the full Alman specification in context and 48
curated evaluation rows. The curated source originally contained 50 rows, but
`curated/berufe/0` and `curated/berufe/1` repeat source/answer pairs present in
the specification. They are excluded because including them would measure
lookup rather than applying the rules.

Acceptance is exact match after the benchmark's light normalization against
each row's accepted Alman renderings. Compliance is a conservative linter for
Standard German forms forbidden by Alman. A compliant answer is not
necessarily correct. Each row is independent, client concurrency was one, and
all reported results are single sampled runs.

## Complete leaderboard

```text
Model                    Acceptance       Compliance       Thinking observed
GPT-5.5 xhigh            45/48 (93.8%)    48/48 (100.0%)   48/48
DeepSeek V4 Flash        42/48 (87.5%)    48/48 (100.0%)   48/48
Kimi K2.7 Code           42/48 (87.5%)    48/48 (100.0%)   48/48
DeepSeek V4 Pro          41/48 (85.4%)    47/48 ( 97.9%)   48/48
GLM 5.2                  39/48 (81.3%)    47/48 ( 97.9%)   48/48
Gemma 4 26B NVFP4        28/48 (58.3%)    46/48 ( 95.8%)   48/48
Qwen 3.6 35B MoE NVFP4    5/48 (10.4%)    30/48 ( 62.5%)   47/48
```

GPT-5.5 is the quality leader. DeepSeek V4 Flash is the selected hosted open
model: it ties Kimi on acceptance and compliance, needs no forced-final call,
and costs about one tenth as much. Gemma is the selected local model. These
choices apply to the exact configurations tested, not the model families in
general.

## Acceptance by collection

```text
Collection          GPT-5.5   DS Flash   Kimi   DS Pro   GLM   Gemma   Qwen
ablaut                  2/2        2/2     2/2      2/2   2/2     2/2    0/2
berufe                  5/5        4/5     5/5      5/5   5/5     2/5    2/5
deutsch-alman         11/11      11/11   10/11    11/11 11/11    9/11   2/11
die-verwandlung         3/4        3/4     3/4      3/4   2/4     3/4    0/4
siddhartha             15/16      12/16   13/16    12/16 10/16    6/16   0/16
starke-flexion          8/8        8/8     7/8      8/8   8/8     5/8    1/8
steppenwolf             1/2        2/2     2/2      0/2   1/2     1/2    0/2
```

The JSON records also store the exact rate and standard error for every
headline and collection score.

## Token use, cost, and duration

```text
Model                 Input tokens   Output tokens   Reported reasoning   Total tokens   Duration   Est. cost
GPT-5.5 xhigh             597,073*         77,468          75,919          674,541       22m25s    not recorded
DeepSeek V4 Flash          603,353         50,124          47,931          653,477       10m44s       $0.0985
DeepSeek V4 Pro            615,984         54,068          52,608          670,052       16m43s       $1.1586
GLM 5.2                    662,464         57,216           4,504          719,680       23m01s       $1.1792
Kimi K2.7 Code             715,938         65,984          64,426          781,922       19m45s       $0.9441
Gemma 4 26B NVFP4          637,586         98,446       unavailable        736,032       62m12s    not recorded
Qwen 3.6 35B MoE NVFP4     645,512        154,987       unavailable        800,499       77m15s    not recorded
```

`*` GPT-5.5 input consisted of 19,537 uncached and 577,536 cached tokens, or
597,073 input tokens in total. Its output count includes reasoning. The table
keeps the cached/uncached distinction here because it is not directly
comparable with the hosted provider records.

Hosted reasoning counts are provider-reported subcounts. GLM omitted the
reasoning subcount on many responses, so its 4,504 figure is known to be
incomplete; its total output and total token counts remain complete.

The GPT-5.5 and hosted token totals cover the 48 evaluated rows. The local
Gemma and Qwen token totals cover all 50 raw requests because the overlap was
discovered after those runs; only their scores were recomputed on 48 rows.
Local costs were not measured. Hosted estimates use the recorded provider
prices and bill all completion tokens, including reasoning and forced-final
calls:

```text
Model                 Input $/1M   Output $/1M   Estimated successful-run cost   Price observed UTC
DeepSeek V4 Flash          0.14            0.28                         $0.09850414   2026-07-11 14:36:11
DeepSeek V4 Pro            1.60            3.20                         $1.15859200   2026-07-11 14:36:11
GLM 5.2                    1.40            4.40                         $1.17920000   2026-07-11 14:55:00
Kimi K2.7 Code             0.95            4.00                         $0.94407710   2026-07-11 14:55:00
```

The cost estimates exclude smoke tests, the discarded partial Kimi attempt,
and any failed or retried provider request for which usage was not returned.
They are therefore successful recorded-run costs, not total account spend.

## GPT-5.5 baseline

- Requested model: `openai/gpt-5.5`.
- Returned model: `gpt-5.5-2026-04-23`.
- Reasoning effort: `xhigh`.
- Repository commit: `f2de2cc`, clean.
- Curated subset start: 2026-07-11 05:10 SGT.
- Curated subset duration: 22 minutes 25 seconds.
- Original evaluation: 179 explicit specification examples plus 50 curated
  rows. Only the 48 non-overlapping curated rows appear in the headline.
- Three failures were recorded in `die-verwandlung`, `siddhartha`, and
  `steppenwolf`; the exact row-level explanation is in
  [`docs/benchmark-results.md`](../docs/benchmark-results.md).
- Artifact:
  `logs/2026-07-10T20-59-22-00-00_alman-bench_B9AC5hZQnPr2rbT9WePck4.eval`
  (local and gitignored).

## Local run configuration

Both local runs used one temporary loopback vLLM server at a time on an NVIDIA
GB10 with 121 GiB unified memory. They used a 32,768-token server context,
8,192 maximum completion tokens, a server-enforced 4,096-token reasoning
budget, temperature 1.0, top-p 0.95, sequential requests, bounded retries,
active `earlyoom`, a 24 GiB available-memory floor, and a 4 GiB free-swap
floor. Neither successful run was pressure-killed, and both servers were
stopped after use.

An offline audit with each pinned tokenizer found a maximum of 4,095 reasoning
tokens. The API did not return per-request reasoning-token counts, so local
result records store reasoning totals as unavailable.

### Gemma 4 26B

- Repository: `nvidia/Gemma-4-26B-A4B-NVFP4`.
- Revision: `a19cfe00be84568a6867111c9a68c9c44fdcffe6`.
- Quantization: NVFP4.
- Runtime: vLLM `0.23.1rc1.dev692+g4e5ca89cf.precompiled`.
- Sampling: temperature 1.0, top-p 0.95, top-k 64.
- Server: four sequences, 16,384 batched tokens, 12 GiB explicit KV cache,
  FP8 KV cache, Triton attention, CUTLASS MoE, prefix caching disabled.
- Thinking: enabled and observed in all 48 evaluated rows.
- Run: 2026-07-11 09:26:14–10:28:26 UTC, 3,732 seconds.
- Clean benchmark commit: `c08d7d9`.
- Recipe source: localperf commit
  `e1570cea896765e84ddca6bbd82c9d0f3a083ada`, profile `32k`.
- Deviations and full redacted server arguments are in
  [`2026-07-11-gemma4-26b-thinking.json`](./2026-07-11-gemma4-26b-thinking.json).

### Qwen 3.6 35B MoE

- Repository: `nvidia/Qwen3.6-35B-A3B-NVFP4`.
- Revision: `491c2f1ea524c639598bf8fa787a93fed5a6fbce`.
- Quantization: NVFP4.
- Runtime: the same pinned vLLM build as Gemma.
- Sampling: temperature 1.0, top-p 0.95, top-k 20.
- Server: one sequence, 1,024 batched tokens, 8 GiB explicit KV cache, FP8
  KV cache, FlashInfer attention, Marlin MoE, eager execution, streaming
  safetensors, prefix caching disabled.
- Thinking: enabled and observed in 47/48 evaluated rows.
- Run: 2026-07-11 10:58:44–12:15:59 UTC, 4,635 seconds.
- Benchmark commit: `c08d7d9`. The tree contained only the untracked Gemma
  result, identified by Git blob
  `845b50310c31971fc7c7a7923e5de23d0ca76064`; it did not affect inputs.
- vLLM 0.24 warmups and more aggressive profiles crossed the configured
  earlyoom floor. The recorded successful profile used vLLM 0.23.1, eager
  execution, standard safetensors, one sequence, smaller prefill chunks, and
  the explicit KV cache rather than weakening the guard.
- Two rows reached the separate 8,192-token total completion cap after
  entering a final answer and were scored incorrect:
  `curated/siddhartha/8` and `curated/starke-flexion/1`.
- Full deviations and redacted arguments are in
  [`2026-07-11-qwen36-35b-thinking.json`](./2026-07-11-qwen36-35b-thinking.json).

## Hosted run configuration

All four hosted runs used the Hugging Face `InferenceClient`, explicit Novita
routing, Chat Completions, one request at a time, temperature 1.0, at most two
retries, and a 4,096-token primary completion ceiling. This ceiling covers
reasoning plus the answer; it is not a provider-independent reasoning-only
counter. If the primary call returned reasoning without an answer, the runner
made one separately bounded forced-final call and included both calls in token
and cost totals.

These were routed Inference Providers requests, not dedicated Hugging Face
Inference Endpoints. No endpoint was created, resumed, or left billable. Hub
SHAs identify the catalog revisions inspected, but Novita did not expose a way
to pin or verify the exact served weight revision; every record therefore says
`served_revision_pinned: false`.

```text
Model              Hub revision                               Provider model ID                  Thinking control          Primary max   Max completion   Max reported reasoning   Fallbacks   Fallback max
DeepSeek V4 Flash  60d8d70770c6776ff598c94bb586a859a38244f1  deepseek/deepseek-v4-flash         reasoning.effort=low       4,096         3,309            3,246                    0           512
DeepSeek V4 Pro    b5968e9190ef611bbf34a7229255be88a0e937c1  deepseek/deepseek-v4-pro           reasoning.effort=low       4,096         4,096            4,096                    1           512
GLM 5.2            b4734de4facf877f85769a911abafc5283eab3d9  zai-org/glm-5.2                     enable_thinking=true       4,096         4,096            2,387                    4           512
Kimi K2.7 Code     74797c9c62378b951a1f6fcf5c4631024e9b8bef  moonshotai/kimi-k2.7-code           forced by model             4,096         4,096            4,095                    5         2,048
```

DeepSeek and GLM forced-final calls disabled thinking. Kimi K2.7 Code forces
thinking and does not support instant mode, so its fallback could not disable
thinking and was raised to 2,048 tokens. This exception is explicit in its
result record; it does not change the 4,096-token primary-call ceiling.

Run windows and benchmark commits:

```text
Model              UTC window                                  Benchmark commit
DeepSeek V4 Pro    2026-07-11 14:36:28–14:53:12                9bf9780b91ef4cdf296b0f0916316eb6ae0a7b0a
DeepSeek V4 Flash  2026-07-11 14:53:12–15:03:56                9bf9780b91ef4cdf296b0f0916316eb6ae0a7b0a
GLM 5.2            2026-07-11 15:06:29–15:29:30                1ce9ba9513bcc0d6a5cc2886705c38374a04b7df
Kimi K2.7 Code     2026-07-11 15:42:55–16:02:40                1ed1e4d73442a266d6b3d9ef5494c78130b62806
```

Exact hosted records:

- [`2026-07-11-deepseek-v4-pro-hf-novita-thinking.json`](./2026-07-11-deepseek-v4-pro-hf-novita-thinking.json)
- [`2026-07-11-deepseek-v4-flash-hf-novita-thinking.json`](./2026-07-11-deepseek-v4-flash-hf-novita-thinking.json)
- [`2026-07-11-glm-5.2-hf-novita-thinking.json`](./2026-07-11-glm-5.2-hf-novita-thinking.json)
- [`2026-07-11-kimi-k2.7-code-hf-novita-thinking.json`](./2026-07-11-kimi-k2.7-code-hf-novita-thinking.json)

## Run history and incidents

- The GPT-5.5 result was filtered from an already completed mixed run. The 179
  explicit specification rows and two overlapping curated rows are not mixed
  into its headline.
- Gemma and Qwen were run before the two curated overlaps were discovered.
  Their 50-request raw logs were preserved, while scores were recomputed on
  the same 48 rows used by later runs.
- The first combined GLM/Kimi hosted batch completed all 48 GLM rows, then the
  initial Kimi run failed on `curated/siddhartha/7`: its 4,096-token primary
  call and original 512-token fallback both returned reasoning without a final
  answer.
- GLM's result was recovered from its complete external JSONL. Its recorded
  completion timestamp comes from that artifact's modification time because
  the batch stopped before publishing the per-profile result.
- The incomplete Kimi samples were discarded rather than mixed with a changed
  fallback policy. Kimi was rerun cleanly from row 1 with a 2,048-token bounded
  fallback. Only the clean rerun appears in its result and cost estimate.
- The hosted runner was then hardened to validate profiles before billable
  requests, keep artifacts outside the worktree, checkpoint completed
  profiles, repair an interrupted final JSONL line, reject duplicate profile
  names/output files, confine batch paths, and validate all score invariants.
- No raw prompts, responses, credentials, or authorization headers are stored
  in the repository. Large samples and server logs remain under local scratch
  paths recorded in the JSON artifacts.

## Review and validation

- Schemator reviewed the local result data model in two iterations; its working
  reports remain under `/home/onur/scratch/alman-benchmark-result-schemator/`.
- An independent Cursor/Claude Fable high-thinking audit checked metrics,
  exclusions, provenance, the local model selection, and reasoning bounds.
- Repeated `codex review --base main` passes drove validation and recovery
  fixes; the final pass reported no actionable correctness regressions.
- `uv run pytest -q`: 117 passed, 1 skipped.
- Targeted Ruff checks passed.
- Both local result records and all four hosted records passed JSON Schema and
  semantic validation.
- A locked Jekyll build completed, and `_site/AGENTS.md` was absent.
- GitHub reported no configured checks or statuses for PR #14.
- At final verification, no vLLM, SGLang, llama.cpp, hosted benchmark, or Alman
  benchmark process remained active. The machine's independent `earlyoom`
  guard remained active.

## Interpretation limits

- This is a task-quality benchmark, not a controlled latency, throughput,
  TTFT, or goodput benchmark. Durations include provider and harness effects
  and should not be used as serving-performance rankings.
- One sampled run per configuration is insufficient for strong statistical
  claims about small differences. In particular, the one-row gap between
  DeepSeek V4 Flash and Pro should not be generalized beyond these runs.
- Provider prices and routed model revisions can change. Prices are timestamped
  in each hosted JSON record, and the served revisions are explicitly unpinned.
- Exact-match acceptance can reject linguistically plausible answers outside
  the authored acceptance set. Compliance is intentionally necessary but not
  sufficient for correctness.
- Artifact paths are diagnostic local paths and may not exist on another
  machine. The compact JSON records are the portable result snapshots.
