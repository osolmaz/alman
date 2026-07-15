# Expanded curated thinking benchmark — 2026-07-15

This is the consolidated result for the expanded Alman benchmark. Every
headline score covers the same 87 curated rows with the full specification in
context. The retained and newly generated rows are combined per model; there
is no separate new-sample leaderboard.

## TLDR

The curated dataset grew from 48 to 87 rows. GPT-5.6 Sol leads at 83/87
(95.4%) acceptance, followed by the legacy GPT-5.5 xhigh ceiling at 80/87
(92.0%) and DeepSeek V4 Pro at 79/87 (90.8%). Gemma 4 26B remains the strongest
tested local model at 59/87 (67.8%). The new ternary and 1-bit Bonsai 27B runs
score 41/87 (47.1%) and 28/87 (32.2%), respectively.

## Dataset and aggregation

| Portion | Collections | Rows |
| --- | --- | ---: |
| Retained curated set | `ablaut`, `berufe`, `deutsch-alman`, `die-verwandlung`, `siddhartha`, `starke-flexion`, `steppenwolf` | 48 |
| Added rule-focused set | `regelabdeckung` | 26 |
| Added relative-clause set | `relativsaetze` | 13 |
| **Combined benchmark** | All nine collections | **87** |

The dataset grew by 39 rows, or 81.3%. For models with portable retained
samples, the runners made requests only for the missing 39 rows, refreshed the
retained targets against the current curated files, rescored all retained
outputs, and emitted one 87-row result record. The two Bonsai variants were
run over all 87 rows from scratch.

GPT-5.5 predates the portable result schemas. Its combined score uses the 48
non-overlapping curated outputs retained in the original successful Inspect
log, rescored against today's acceptance sets, plus a successful 39-row
extension over the two added collections. The logs remain row-level and
independently scored; only their combined 87-row counts appear below. This
current rescore changes the retained portion from its historical 45/48 to
43/48.

Acceptance is normalized exact match against each row's complete set of valid
Alman renderings. Compliance is a conservative linter for forbidden Standard
German surface forms. Compliance is only a necessary floor: an unrelated or
incorrect answer can be compliant, so acceptance is the primary ranking
metric.

## Complete 87-row leaderboard

| Model | Route or format | Acceptance ↑ | Compliance ↑ | Thinking observed | Est. API cost |
| --- | --- | ---: | ---: | ---: | ---: |
| [GPT-5.6 Sol](./2026-07-15-gpt-5.6-sol-xhigh.json) | OpenAI API, xhigh | **83/87 (95.4%)** | **87/87 (100.0%)** | 69/87 | $3.4891 |
| GPT-5.5 | OpenAI API, xhigh | 80/87 (92.0%) | **87/87 (100.0%)** | 87/87 | not recorded |
| [DeepSeek V4 Pro](./2026-07-15-deepseek-v4-pro-hf-novita-thinking.json) | Novita | 79/87 (90.8%) | 86/87 (98.9%) | 87/87 | $2.0622 |
| [Kimi K2.7 Code](./2026-07-15-kimi-k2.7-code-hf-novita-thinking.json) | Novita | 78/87 (89.7%) | **87/87 (100.0%)** | 87/87 | $1.5405 |
| [GPT-5.6 Luna](./2026-07-15-gpt-5.6-luna-xhigh.json) | OpenAI API, xhigh | 78/87 (89.7%) | 86/87 (98.9%) | 86/87 | $0.8139 |
| [GPT-5.6 Terra](./2026-07-15-gpt-5.6-terra-xhigh.json) | OpenAI API, xhigh | 78/87 (89.7%) | 86/87 (98.9%) | 77/87 | $1.7299 |
| [DeepSeek V4 Flash](./2026-07-15-deepseek-v4-flash-hf-novita-thinking.json) | Novita | 76/87 (87.4%) | **87/87 (100.0%)** | 87/87 | $0.1781 |
| [Claude Sonnet 5](./2026-07-15-claude-sonnet-5-xhigh.json) | Anthropic API, xhigh | 75/87 (86.2%) | 83/87 (95.4%) | 87/87 | $1.4893 |
| [GLM 5.2](./2026-07-15-glm-5.2-hf-novita-thinking.json) | Novita | 73/87 (83.9%) | 86/87 (98.9%) | 87/87 | $2.0124 |
| [Nemotron 3 Ultra](./2026-07-15-nemotron3-ultra-hf-together-thinking.json) | Together | 73/87 (83.9%) | 86/87 (98.9%) | 87/87 | $1.0069 |
| [Step 3.7 Flash](./2026-07-15-step3.7-flash-hf-deepinfra-thinking.json) | DeepInfra | 69/87 (79.3%) | 84/87 (96.6%) | 87/87 | $0.4049 |
| [MiniMax M3](./2026-07-15-minimax-m3-hf-novita-thinking.json) | Novita | 68/87 (78.2%) | 85/87 (97.7%) | 84/87 | $0.4478 |
| [Qwen 3.6 35B](./2026-07-15-qwen36-35b-hf-deepinfra-thinking.json) | DeepInfra | 66/87 (75.9%) | 75/87 (86.2%) | 77/87 | $0.3679 |
| [GPT-5.4 mini](./2026-07-15-gpt-5.4-mini-xhigh.json) | OpenAI API, xhigh | 63/87 (72.4%) | 81/87 (93.1%) | 87/87 | $1.1658 |
| [Gemma 4 26B NVFP4](./2026-07-15-gemma4-26b-thinking.json) | Local vLLM | 59/87 (67.8%) | 84/87 (96.6%) | 87/87 | not measured |
| [Ternary Bonsai 27B](./2026-07-15-ternary-bonsai-27b-thinking.json) | Local llama.cpp, ternary Q2_0 | 41/87 (47.1%) | 82/87 (94.3%) | 87/87 | not measured |
| [Bonsai 27B 1-bit](./2026-07-15-bonsai-27b-1bit-thinking.json) | Local llama.cpp, binary Q1_0 | 28/87 (32.2%) | 71/87 (81.6%) | 87/87 | not measured |
| [Qwen 3.6 35B NVFP4](./2026-07-15-qwen36-35b-thinking-pp15.json) | Local vLLM, presence penalty 1.5 | 9/87 (10.3%) | 66/87 (75.9%) | 80/87 | not measured |

Ties on acceptance are shown in compliance order. All results are single
sampled runs; small differences should not be treated as deterministic model
gaps.

## Cost and token accounting

The 13 portable API records total $16.7089 for their combined successful
87-row samples: $8.0207 across Hugging Face Inference Providers, $7.1988
across the four current OpenAI profiles, and $1.4893 for Claude Sonnet 5. The
Claude total includes its successful one-hour cache prewarm. These are
artifact-derived successful-run estimates, not total account spend; failed
requests, smoke tests, and discarded attempts may not return billable usage.
GPT-5.5 pricing was not recorded for either retained log, and local electricity
or hardware cost was not measured.

GPT-5.5 used 82,730 uncached input tokens, 1,034,496 cached input tokens,
91,921 output tokens, and 1,209,147 total tokens across the combined rows;
89,699 output tokens were reported as reasoning. The 39-row extension took
2 minutes 4 seconds with four connections and zero HTTP retries.

## Bonsai results

The ternary model leads the 1-bit model by 13 accepted rows, or 14.9 percentage
points, and by 11 compliant rows, or 12.6 points. Ternary used 1,440,456 total
tokens and completed in 2:43:31 with one server slot. The 1-bit model used
1,470,331 total tokens and completed in 1:13:25 with four 32K-context slots.
The runtime difference is not a model-only speed comparison because the slot
counts differ.

Both runs used the same 8,192-token completion ceiling, a 4,096-token reasoning
budget, temperature 0.7, top-p 0.95, top-k 20, prompt caching, and pinned
PrismML llama.cpp commit `62061f91088281e65071cc38c5f69ee95c39f14e`.
The ternary weights were pinned to Hub revision
`20e435f518bd5b882795954aba81e80a91894321`; the 1-bit weights were pinned to
`0cf7e3d21581b169b4df1de8bf01316000e2fbb7`.

## Provenance and exclusions

- The original GPT-5.5 source is
  `logs/2026-07-10T20-59-22-00-00_alman-bench_B9AC5hZQnPr2rbT9WePck4.eval`.
  Its two curated rows that duplicated specification examples remain excluded.
- The GPT-5.5 extension is
  `/home/onur/scratch/alman-benchmark-runs/incremental-87/gpt55/2026-07-15T18-54-20-00-00_alman-bench_6SGHVKU3Fmh7ECHWLmQKY7.eval`.
- Portable raw samples, Inspect logs, server logs, smoke responses, and model
  weights remain outside the repository. Compact result records link their
  exact artifact paths and immutable model revisions where available.
- The two 39-row local checkpoint records are not published as leaderboard
  entries. Their retained and new samples appear only through the consolidated
  87-row records.
- The interrupted 25-row serial 1-bit attempt was discarded. Only the complete
  four-slot 87-row run is reported.
- No specification-example rows are present in any 87-row headline.

## Validation

- All 17 portable 87-row JSON records pass their family-specific JSON Schema
  and semantic validators.
- Both GPT-5.5 Inspect logs have successful status; the retained source covers
  48 evaluated curated rows and the extension covers exactly the 39 added rows.
- Every leaderboard acceptance and compliance percentage is derived from its
  displayed integer count.
- `uv run pytest -q`: 151 passed, 1 skipped.
- The Bonsai servers shut down after their runs, and neither memory guard
  reported a pressure kill.
