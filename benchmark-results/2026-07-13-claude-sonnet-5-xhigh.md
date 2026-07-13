# Claude Sonnet 5 benchmark, 2026-07-13

Claude Sonnet 5 accepted 40 of 48 translations (83.3%) and passed the
compliance check on 44 (91.7%). Acceptance is normalized exact match against
the answers allowed by the current specification. Compliance checks the
surface form for eliminated Standard German forms. Acceptance is the primary
score.

```text
Metric                         Claude Sonnet 5
Acceptance                          40/48
Compliance                          44/48
Reasoning observed                  48/48
Forced-final rows                       8
Cache hits                          48/48
Observed successful-run cost      $1.055931
Cold-cache equivalent             $1.137118
Wall time                            7m03s
```

The result places Claude Sonnet 5 behind GPT-5.6 Luna and Terra by one accepted
row, and ahead of GPT-5.4 mini by eleven. GPT-5.6 Sol remains first with 46
accepted rows. Claude used more output tokens and cost more than each GPT run.

```text
Model                 Acceptance   Compliance   Est. cost
GPT-5.6 Sol                46/48        48/48      $0.7754
GPT-5.6 Luna               41/48        47/48      $0.2578
GPT-5.6 Terra              41/48        47/48      $0.3696
Claude Sonnet 5            40/48        44/48      $1.0559
GPT-5.4 mini               29/48        42/48      $0.6013
```

The comparison uses the updated-rules GPT records from the same date. All five
runs evaluated the same 48 curated rows with the specification in context and
no specification examples in the dataset.

## Acceptance by collection

```text
Collection          Accepted
ablaut                   2/2
berufe                   5/5
deutsch-alman           11/11
die-verwandlung          4/4
siddhartha              10/16
starke-flexion           8/8
steppenwolf              0/2
```

Six of the eight misses came from *Siddhartha*. The other two were the
*Steppenwolf* rows. Four rows failed compliance: `curated/siddhartha/2`,
`curated/siddhartha/10`, `curated/siddhartha/13`, and
`curated/steppenwolf/0`.

## Tokens, cache, and cost

The system block contained the full generated Alman specification and an
explicit one-hour Anthropic cache breakpoint. The runner warmed the prefix
before scoring, verified one row sequentially, then used four concurrent
requests. It aborted on a cache miss. Every scored row reported cached input.

```text
Token category                         Tokens
Uncached row input                      3,672
Cached specification input          1,196,440
Output                                 80,499
Hidden reasoning within output         78,084
Prewarm cached input                    21,365
Prewarm uncached input                      13
Prewarm output                               1
```

The exact successful-run estimate is $1.055931. It includes $0.004309 for the
prewarm cache read. The cache entry already existed after the discarded
preflight described below. Replacing that read with a fresh one-hour cache
write makes the same run cost about $1.137118 from a cold cache.

The estimate uses Anthropic's introductory Claude Sonnet 5 prices observed on
2026-07-13: $2 per million uncached input tokens, $4 per million tokens for a
one-hour cache write, $0.20 per million cache-read tokens, and $10 per million
output tokens. The introductory prices are listed through 2026-08-31 in the
[Anthropic pricing documentation](https://platform.claude.com/docs/en/about-claude/pricing).

## Run configuration

The run used `claude-sonnet-5` through Anthropic Messages API version
`2023-06-01` at benchmark commit
`e411a98095ad7a78a031ca15b55f626979358bbc`. Adaptive thinking was enabled at
`xhigh` effort with thinking display omitted. The 4,096-token primary limit was
a hard cap across hidden reasoning and visible output. Eight rows reached that
limit without visible text and used a second request capped at 512 tokens with
thinking disabled and low effort. Anthropic reports `claude-sonnet-5` as a
pinned model ID in its [model documentation](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions).

The successful run started at 07:55:20 UTC and ended at 08:02:23 UTC. The
machine-readable result passed its JSON Schema and cross-field checks. Raw row
records and the manifest remain outside the repository under
`/home/onur/scratch/alman-benchmark-runs/anthropic/20260713T080300Z/`.

## Discarded cache preflight

The first preflight warmed the specification with thinking disabled, then sent
four concurrent adaptive-thinking requests. Anthropic treated the thinking
configuration as part of the cache key, so all four rows missed the disabled-
thinking entry. The cache guard stopped the batch before it saved or scored a
row. The runner was changed to prewarm with the exact primary thinking settings
and to verify one row before starting concurrent requests.

The discarded prewarm usage was preserved and cost $0.085496. The four rejected
row responses were not persisted, so their exact usage cannot be reconstructed.
The known preflight cost is at least $0.085496. A conservative bound using four
full one-hour cache writes and four complete 4,096-token outputs puts the whole
discarded attempt below $0.5914. Its external manifest remains under
`/home/onur/scratch/alman-benchmark-runs/anthropic/20260713T075800Z/`.

Exact machine-readable record:

- [`2026-07-13-claude-sonnet-5-xhigh.json`](./2026-07-13-claude-sonnet-5-xhigh.json)
