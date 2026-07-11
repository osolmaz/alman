# Local thinking-model comparison — 2026-07-11

Higher is better for every metric below. `Change` is Qwen minus Gemma in
percentage points. Stars mark the impact of the winning value.

```text
Metric               Gemma 4 26B   Qwen 3.6 35B MoE   Change
Acceptance           .58***        .10                 -48%
Compliance           .96***        .63                 -33%
Reasoning observed  1.00*          .98                  -2%
```

Gemma 4 26B is the selected model. It accepted 28/48 evaluated items and
complied on 46/48, compared with Qwen's 5/48 acceptance and 30/48 compliance. This is a
single sampled run per model, so the result supports this configuration choice
rather than a general claim about either model family.

Both raw runs used the complete Alman specification in context and logged 50
curated rows. Post-run validation found that `curated/berufe/0` and
`curated/berufe/1` duplicated specification examples, so those rows were
discarded from both models' scores. The remaining 48 rows contain no spec
example/answer pairs. Both runs enabled thinking, used vLLM's server-enforced
4,096-token reasoning budget, allowed 8,192 total output tokens, and processed
one request at a time under memory guards. Per-sample reasoning token counts
were not returned, so the bound is configuration evidence rather than a
measured token statistic. The exact
weights, runtime, sampling values, server arguments, recipe deviations, token
usage, group scores, and artifact locations are recorded in:

- [`2026-07-11-gemma4-26b-thinking.json`](./2026-07-11-gemma4-26b-thinking.json)
- [`2026-07-11-qwen36-35b-thinking.json`](./2026-07-11-qwen36-35b-thinking.json)

Qwen's dirty-tree flag is fully identified in its result: the only change was
the untracked Gemma result (Git blob `845b50310c31971fc7c7a7923e5de23d0ca76064`),
which did not affect the task, specification, or dataset.
