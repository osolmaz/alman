# OpenAI benchmark with updated Alman rules, 2026-07-13

GPT-5.6 Sol accepted 46 of 48 translations (95.8%) and passed the compliance
check on all 48. GPT-5.6 Luna and Terra each accepted 41 rows, while GPT-5.4
mini accepted 29.

Acceptance is normalized exact match against every answer allowed by the
current specification. Compliance is a surface-form check for eliminated
Standard German forms. Acceptance remains the primary score.

```text
Metric (direction)       GPT-5.4 mini   GPT-5.6 Luna   GPT-5.6 Sol   GPT-5.6 Terra
Acceptance (higher)          29/48          41/48          46/48          41/48
Compliance (higher)          42/48          47/48          48/48          47/48
Reasoning observed           48/48          47/48          35/48          38/48
Forced-final rows (lower)       25              1              0              0
Estimated cost USD          $0.6013        $0.2578        $0.7754        $0.3696
Wall time                     4m40s          1m39s          2m28s          1m11s
```

The quality order for this run is Sol first, followed by Luna and Terra, then
mini. Luna and Terra tie on both headline scores. Luna used fewer reasoning
tokens, while Terra finished sooner and cost about $0.11 more.

## Acceptance by collection

```text
Collection          GPT-5.4 mini   GPT-5.6 Luna   GPT-5.6 Sol   GPT-5.6 Terra
ablaut                    2/2             2/2            2/2            2/2
berufe                    5/5             5/5            5/5            5/5
deutsch-alman            10/11           11/11          11/11          11/11
die-verwandlung           2/4             4/4            4/4            4/4
siddhartha                2/16           11/16          15/16          11/16
starke-flexion            8/8             8/8            8/8            8/8
steppenwolf               0/2             0/2            1/2            0/2
```

Sol missed `curated/siddhartha/5` by producing *ein mit die Weltall* instead
of *eins mit die Weltall*. It also kept masculine singular pronouns in
`curated/steppenwolf/1`, where the specification requires singular **sie**
with plural agreement for a generic person.

## Change from the 2026-07-12 GPT run

```text
Model            Acceptance before   Acceptance now   Change   Compliance before   Compliance now
GPT-5.4 mini          30/48               29/48        -2.1 pp       40/48                42/48
GPT-5.6 Luna          42/48               41/48        -2.1 pp       48/48                47/48
GPT-5.6 Sol           46/48               46/48         0.0 pp       48/48                48/48
GPT-5.6 Terra         43/48               41/48        -4.2 pp       48/48                47/48
```

The earlier run used the previous specification and acceptance target. The
current target changes *alles, was Siddhartha ...* to canonical *alles, das
Siddhartha ...*, with *die* also accepted. Sampling is nondeterministic, so
the changes above mix the rule update with ordinary run variance.

## Tokens and cost

```text
Model            Input tokens   Cached input   Output tokens   Reasoning tokens   Total tokens   Est. cost
GPT-5.4 mini         975,703        953,088         113,978          112,409        1,089,681       $0.6013
GPT-5.6 Luna         654,353        614,124          26,020           24,251          680,373       $0.2578
GPT-5.6 Sol          640,945        627,455          13,141           11,489          654,086       $0.7754
GPT-5.6 Terra        640,945        627,429          11,927           10,285          652,872       $0.3696
```

The valid run used 3,077,012 total tokens and cost an estimated $2.0041. Of
2,911,946 input tokens, 2,822,096 were reported as cached.

An initial pass was discarded after it exposed the stale `was` reference in
the curated dataset. That pass cost an estimated $6.9927. Its raw artifacts
and result summaries were deleted. Total estimated API use for both passes
was $8.9967.

## Run configuration

Every primary request received the English Alman specification generated from
the JSON source at benchmark commit
`f2e73526fd96984fa17403297be9b01cbc2c4031`. The loader evaluated 48 curated
rows after excluding the two occupational-title rows duplicated in the spec.
Git tag `benchmark-openai-updated-rules-2026-07-13` retains that exact clean
commit after later changes to the main branch.

All models used `reasoning_effort=xhigh`, four concurrent requests, up to two
retries, and a 4,096-token primary completion limit covering reasoning and
visible output. An empty primary answer triggered a fresh 512-token call with
reasoning disabled. All four result files passed schema and consistency
validation.

```text
Label            Requested and returned model        UTC window
GPT-5.4 mini     gpt-5.4-mini-2026-03-17             07:31:08 to 07:35:48
GPT-5.6 Luna     gpt-5.6-luna                        07:35:48 to 07:37:27
GPT-5.6 Sol      gpt-5.6-sol                         07:37:27 to 07:39:54
GPT-5.6 Terra    gpt-5.6-terra                       07:39:54 to 07:41:05
```

Wall time records the observed four-way concurrent API run. It is included
only as run provenance and does not measure controlled serving performance.

Raw row records and manifests remain outside the repository under
`/home/onur/scratch/alman-benchmark-runs/openai/20260713T073107Z-updated-rules-corrected/`.
The repository stores compact result records without prompts, responses,
reasoning text, or credentials.

Exact machine-readable records:

- [`2026-07-13-gpt-5.4-mini-xhigh.json`](./2026-07-13-gpt-5.4-mini-xhigh.json)
- [`2026-07-13-gpt-5.6-luna-xhigh.json`](./2026-07-13-gpt-5.6-luna-xhigh.json)
- [`2026-07-13-gpt-5.6-sol-xhigh.json`](./2026-07-13-gpt-5.6-sol-xhigh.json)
- [`2026-07-13-gpt-5.6-terra-xhigh.json`](./2026-07-13-gpt-5.6-terra-xhigh.json)
