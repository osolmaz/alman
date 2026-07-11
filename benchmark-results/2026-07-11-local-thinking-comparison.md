# Local thinking-model comparison — 2026-07-11

Higher is better for every metric below. `Change` is Qwen minus Gemma in
percentage points. Stars mark the impact of the winning value.

```text
Metric               Gemma 4 26B   Qwen 3.6 35B MoE   Change
Acceptance           .60***        .12                 -48%
Compliance           .96***        .64                 -32%
Reasoning observed  1.00*          .98                  -2%
```

Gemma 4 26B is the selected model. It accepted 30/50 curated items and complied
on 48/50, compared with Qwen's 6/50 acceptance and 32/50 compliance. This is a
single sampled run per model, so the result supports this configuration choice
rather than a general claim about either model family.

Both runs used the complete Alman specification in context, excluded every
example from that specification from the 50-row curated dataset, enabled
thinking, enforced a 4,096-token reasoning budget, allowed 8,192 total output
tokens, and processed one request at a time under memory guards. The exact
weights, runtime, sampling values, server arguments, recipe deviations, token
usage, group scores, and artifact locations are recorded in:

- [`2026-07-11-gemma4-26b-thinking.json`](./2026-07-11-gemma4-26b-thinking.json)
- [`2026-07-11-qwen36-35b-thinking.json`](./2026-07-11-qwen36-35b-thinking.json)
