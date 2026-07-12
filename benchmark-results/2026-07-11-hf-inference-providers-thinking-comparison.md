# Hugging Face Inference Providers thinking comparison — 2026-07-11

Acceptance and compliance are higher-is-better. Estimated cost and forced-final
fallbacks are lower-is-better. Stars mark the decisive lower-cost and
lower-fallback tie-breakers; tied quality values are unmarked.

```text
Metric                    DeepSeek V4 Pro   DeepSeek V4 Flash   GLM 5.2   Kimi K2.7 Code
Acceptance                         .85                 .88          .81              .88
Compliance                         .98                1.00          .98             1.00
Estimated cost USD                1.16                 .099****    1.18              .94
Forced-final rows                    1                    0****       4                 5
Reasoning observed                1.00                1.00         1.00             1.00
```

DeepSeek V4 Flash is the selected hosted model. It tied Kimi K2.7 Code for the
best acceptance score at 42/48, complied on all 48 rows, needed no forced-final
fallback, and cost an estimated $0.0985. Kimi reached the same quality score but
cost an estimated $0.9441 and needed five fallback requests. DeepSeek V4 Pro
accepted 41/48 for $1.1586. GLM 5.2 accepted 39/48 for $1.1792.

GPT-5.5 xhigh remains the quality leader from the earlier informed-ceiling run:
45/48 acceptance and 48/48 compliance. DeepSeek V4 Flash and Kimi K2.7 Code are
three accepted rows behind it. The hosted open-model runs are also well ahead
of the earlier local runs: Gemma 4 26B accepted 28/48 and Qwen 3.6 35B MoE
accepted 5/48.

All four runs used the complete Alman specification in context and the same 48
curated rows after removing the two rows that duplicated specification
examples. Calls were sent serially through Hugging Face Inference Providers
with explicit Novita routing and thinking enabled. Each primary call had a
4,096-token completion ceiling covering its reasoning and answer. If that call
returned no final answer, the runner made a separately bounded forced-final
request: 512 tokens with thinking disabled for DeepSeek and GLM, or 2,048
tokens for Kimi because Kimi K2.7 Code forces thinking and does not support an
instant mode. These extra calls are included in token and cost totals.

The repository SHA identifies the Hub catalog revision inspected for each
model. The routed provider did not expose a way to pin or verify its served
weight revision, so every record states `served_revision_pinned: false`. This
is one sampled quality run per model, not a controlled serving-latency or
throughput benchmark.

Exact model, provider, sampling, token, pricing, group-score, fallback, and
artifact provenance is recorded in:

- [`2026-07-11-deepseek-v4-pro-hf-novita-thinking.json`](./2026-07-11-deepseek-v4-pro-hf-novita-thinking.json)
- [`2026-07-11-deepseek-v4-flash-hf-novita-thinking.json`](./2026-07-11-deepseek-v4-flash-hf-novita-thinking.json)
- [`2026-07-11-glm-5.2-hf-novita-thinking.json`](./2026-07-11-glm-5.2-hf-novita-thinking.json)
- [`2026-07-11-kimi-k2.7-code-hf-novita-thinking.json`](./2026-07-11-kimi-k2.7-code-hf-novita-thinking.json)
