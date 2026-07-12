# OpenAI xhigh reasoning comparison — 2026-07-12

GPT-5.6 Sol accepted 46/48 rows (95.8%) with perfect compliance, making it the
new overall quality leader. GPT-5.6 Terra accepted 43/48, GPT-5.6 Luna 42/48,
and GPT-5.4 mini 30/48. The previous GPT-5.5 xhigh ceiling was 45/48.

Acceptance is exact match against an allowed Alman answer after light
normalization and is the primary quality score. Compliance is only a linter
floor: all six wrong Luna answers, both wrong Sol answers, and all five wrong
Terra answers were still compliant.

```text
Metric (direction)       GPT-5.4 mini   GPT-5.6 Luna   GPT-5.6 Sol   GPT-5.6 Terra
Acceptance (higher)          .63             .88            .96            .90
Compliance (higher)          .83            1.00           1.00           1.00
Reasoning observed          1.00             .98            .73            .92
Forced-final rows (lower)     30                1              0              0
Estimated cost USD           .72             .76           3.34           1.66
Wall time                    5m08s            1m31s          2m38s          1m10s
```

These are single sampled quality runs. Wall time includes four concurrent
requests and is not a controlled serving-latency benchmark.

## Updated overall ranking

The ranking uses acceptance first, then compliance, cost, and fallback count
to order ties.

```text
Rank   Model                              Acceptance   Compliance
 1     GPT-5.6 Sol xhigh                    46/48        48/48
 2     GPT-5.5 xhigh                        45/48        48/48
 3     GPT-5.6 Terra xhigh                  43/48        48/48
 4     DeepSeek V4 Flash                    42/48        48/48
 5     GPT-5.6 Luna xhigh                   42/48        48/48
 6     Kimi K2.7 Code                       42/48        48/48
 7     DeepSeek V4 Pro                      41/48        47/48
 8     GLM 5.2                              39/48        47/48
 9     Nemotron 3 Ultra                     37/48        47/48
10     Step 3.7 Flash                       36/48        45/48
11     MiniMax M3                           33/48        46/48
12     GPT-5.4 mini xhigh                   30/48        40/48
13     Hosted Qwen 3.6 35B                  30/48        36/48
14     Local Gemma 4 26B                    28/48        46/48
15     Local Qwen 3.6 35B NVFP4              5/48        36/48*
```

`*` The local Qwen entry uses the better-compliance `presence_penalty=1.5`
follow-up; both local Qwen configurations accepted 5/48.

DeepSeek V4 Flash ranks above Luna and Kimi in the 42/48 tie because all three
were fully compliant, while DeepSeek cost about $0.10 and needed no fallback;
Luna cost about $0.76 with one fallback, and Kimi cost about $0.94 with five.

## Acceptance by collection

```text
Collection          GPT-5.4 mini   GPT-5.6 Luna   GPT-5.6 Sol   GPT-5.6 Terra
ablaut                    2/2             2/2            2/2            2/2
berufe                    5/5             5/5            5/5            5/5
deutsch-alman            10/11           10/11          11/11          11/11
die-verwandlung           1/4             3/4            3/4            3/4
siddhartha                4/16           12/16          15/16          12/16
starke-flexion            8/8             8/8            8/8            8/8
steppenwolf               0/2             2/2            2/2            2/2
```

Sol's two misses were `curated/die-verwandlung/2` and
`curated/siddhartha/2`. The same two rows also defeated Luna and Terra, so they
remain useful discriminating cases despite Sol's near-ceiling score.

## Tokens, caching, and cost

```text
Model            Input tokens   Cached input   Output tokens   Reasoning tokens   Total tokens   Est. cost
GPT-5.4 mini         971,239        914,432         134,312          132,766        1,105,551       $0.7156
GPT-5.6 Luna         609,571         12,413          27,719           25,927          637,290       $0.7647
GPT-5.6 Sol          597,073         12,413          13,803           12,146          610,876       $3.3436
GPT-5.6 Terra        597,073         12,413          13,287           11,594          610,360       $1.6641
```

The successful recorded runs total an estimated $6.4880. The estimate prices
uncached input, cached input, and all output tokens—including reasoning—at the
rates recorded in each JSON result. It excludes four smoke calls. The GPT-5.6
model pages state that cache writes may carry a 1.25× charge, but API usage did
not identify cache-write tokens separately, so any such surcharge is not in
the estimate.

GPT-5.4 mini's 30 exhausted primaries caused 30 additional prompt submissions,
which explains its much larger input and output totals. Its unusually high
cached-input count kept its estimated cost near Luna's, but the 30/48 score is
the result of this bounded xhigh configuration—not an unconstrained measure of
the model's maximum quality.

## Reproducible configuration

Every call received the complete Alman specification and the same 48 curated
rows after excluding the two rows whose answers occur in the specification.
All models were requested with `reasoning_effort=xhigh`, four-way concurrency,
at most two retries, and a 4,096-token primary completion ceiling covering both
reasoning and visible output. An answerless primary received one fresh
512-token request with `reasoning_effort=none`; the runner rejected any fallback
that reported reasoning tokens.

```text
Label            Requested model                  Returned model                  Input/cached/output $/MTok
GPT-5.4 mini     gpt-5.4-mini-2026-03-17          gpt-5.4-mini-2026-03-17          .75 / .075 / 4.50
GPT-5.6 Luna     gpt-5.6-luna                     gpt-5.6-luna                    1.00 / .10  / 6.00
GPT-5.6 Sol      gpt-5.6-sol                      gpt-5.6-sol                     5.00 / .50  / 30.00
GPT-5.6 Terra    gpt-5.6-terra                    gpt-5.6-terra                   2.50 / .25  / 15.00
```

GPT-5.4 mini used the dated snapshot exposed by the API. The GPT-5.6 model
catalog exposed only the explicit Luna, Sol, and Terra IDs, so those records
cannot pin a dated snapshot. `xhigh` was sent on every primary call, but
reported reasoning was observed on 48/48 mini rows, 47/48 Luna rows, 35/48 Sol
rows, and 44/48 Terra rows. Requested effort and observed token use are kept as
separate fields.

Run windows and clean benchmark revision:

```text
Model            UTC window                         Benchmark commit
GPT-5.4 mini     2026-07-12 10:37:50–10:42:58       b66e4916698782cabb8f376b52ae98c99b5d1796
GPT-5.6 Luna     2026-07-12 10:42:58–10:44:28       b66e4916698782cabb8f376b52ae98c99b5d1796
GPT-5.6 Sol      2026-07-12 10:44:28–10:47:07       b66e4916698782cabb8f376b52ae98c99b5d1796
GPT-5.6 Terra    2026-07-12 10:47:07–10:48:17       b66e4916698782cabb8f376b52ae98c99b5d1796
```

Raw row records, the profile manifest, and aggregate checkpoints are external
under `/home/onur/scratch/alman-benchmark-runs/openai/20260712T102000Z-openai-xhigh/`.
No credentials, raw prompts, raw responses, or reasoning text are stored in the
repository. `benchmark-results` remains excluded from Jekyll output.

Exact machine-readable records:

- [`2026-07-12-gpt-5.4-mini-xhigh.json`](./2026-07-12-gpt-5.4-mini-xhigh.json)
- [`2026-07-12-gpt-5.6-luna-xhigh.json`](./2026-07-12-gpt-5.6-luna-xhigh.json)
- [`2026-07-12-gpt-5.6-sol-xhigh.json`](./2026-07-12-gpt-5.6-sol-xhigh.json)
- [`2026-07-12-gpt-5.6-terra-xhigh.json`](./2026-07-12-gpt-5.6-terra-xhigh.json)
