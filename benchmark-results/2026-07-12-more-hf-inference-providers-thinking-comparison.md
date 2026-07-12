# Additional Hugging Face Inference Providers thinking comparison — 2026-07-12

Nemotron 3 Ultra performed best among these four additions: 37/48 acceptance
(77.1%) and 47/48 compliance (97.9%). Step 3.7 Flash followed at 36/48,
MiniMax M3 at 33/48, and hosted Qwen 3.6 35B-A3B at 30/48. None displaced
DeepSeek V4 Flash, which remains the selected hosted open model from the prior
run at 42/48 acceptance, 48/48 compliance, and an estimated $0.0985.

Acceptance is exact match against an allowed Alman answer after light
normalization and is the primary quality score. Compliance is only a linter
floor: it detects some forbidden Standard German forms, but a compliant answer
can still be incorrect, incomplete, or unrelated.

```text
Metric (direction)       Qwen 3.6 35B   MiniMax M3   Nemotron 3 Ultra   Step 3.7 Flash
Acceptance (higher)        .63             .69             .77               .75
Compliance (higher)        .75             .96             .98               .94
Reasoning observed        1.00             .96            1.00              1.00
Forced-final rows (lower)   14                3                1                 10
Estimated cost USD         .23              .26             .60               .26
Wall time                  5m11s            4m25s           11m57s            5m18s
```

Quality, fallbacks, cost, and time are separate dimensions. These are single
sampled quality runs, not controlled serving latency or throughput
measurements.

## Acceptance by collection

```text
Collection          Qwen 3.6 35B   MiniMax M3   Nemotron 3 Ultra   Step 3.7 Flash
ablaut                     2/2            2/2              2/2              2/2
berufe                     5/5            4/5              3/5              4/5
deutsch-alman              9/11          10/11            10/11            11/11
die-verwandlung            3/4            2/4              2/4              1/4
siddhartha                 3/16           7/16            12/16            10/16
starke-flexion             8/8            7/8              7/8              8/8
steppenwolf                0/2            1/2              1/2              0/2
```

Nemotron's lead came mostly from `siddhartha`, where it accepted 12/16 versus
10/16 for Step, 7/16 for MiniMax, and 3/16 for Qwen. Qwen was strongest on the
shorter `berufe` and `starke-flexion` collections but degraded sharply on the
long literary passages.

## Tokens, cost, and fallbacks

```text
Model              Input tokens   Output tokens   Reported reasoning   Total tokens   Fallbacks   Est. cost
Qwen 3.6 35B           801,331         118,238       unavailable          919,569          14        $0.2325
MiniMax M3             657,696          53,400       unavailable          711,096           3        $0.2614
Nemotron 3 Ultra       620,900          62,296          60,944            683,196           1        $0.5968
Step 3.7 Flash         771,474          89,558       unavailable          861,032          10        $0.2573
```

The four successful recorded runs cost an estimated $1.3480 in total. The
estimate applies the recorded input/output prices to all successful-run tokens,
including forced-final calls. It excludes smoke probes, the failed partial Step
attempt, and provider requests that failed without returning usage, so it is
not total account spend.

Prices observed on 2026-07-12 were $0.15/$0.95 per million input/output tokens
for Qwen through DeepInfra, $0.30/$1.20 for MiniMax through Novita,
$0.60/$3.60 for Nemotron through Together, and $0.20/$1.15 for Step through
DeepInfra.

## Reproducible configuration

Every model received the complete Alman specification and the same 48 curated
rows. The two curated rows duplicating examples in the specification remained
excluded. Requests used Chat Completions through explicitly selected Hugging
Face Inference Providers routes, temperature 1.0, top-p 0.95, four concurrent
requests, at most two retries, and a hard 4,096-token ceiling on each primary
completion. That ceiling covers reasoning plus any answer; it is not a
provider-independent reasoning-only counter.

```text
Model              Provider    Hub revision                               Thinking control                         Final fallback
Qwen 3.6 35B       DeepInfra   995ad96eacd98c81ed38be0c5b274b04031597b0  enable_thinking=true; top-k 20; PP 1.5   disable thinking, 512
MiniMax M3         Novita      50942730318c7943fe83db7ec8e9f9177ecb1cf8  thinking_mode=enabled                    disable thinking, 512
Nemotron 3 Ultra   Together    183968f87ae4cedce3039313cac1fd43d112c578  enable_thinking=true                     disable thinking, 512
Step 3.7 Flash     DeepInfra   5f6244077ac62e04eec3f320501ff8c2b293373a  reasoning_effort=high                    answer continuation, 512
```

For Qwen, MiniMax, and Nemotron, a primary response with no final content was
followed by a new request carrying the completed reasoning and disabling
thinking. Step's template always starts a reasoning block, including for
`low`, `none`, and `off`, so that strategy could not guarantee a reply. Its
successful run instead continued the existing assistant message after its
closed reasoning block, prefilled a double quote, and stopped at the closing
double quote. DeepInfra's Step reasoning parser reports those answer-channel
continuation tokens in the `reasoning` response field; the result therefore
records `continue-prefilled-answer` and `forced_final_output_field: reasoning`
explicitly. All ten Step fallbacks stopped normally within 6–89 completion
tokens, below their 512-token ceiling.

Thinking output was observed on all Qwen, Nemotron, and Step rows and 46/48
MiniMax rows. MiniMax was still requested with `thinking_mode=enabled` on every
row; the provider returned no separate reasoning content for two responses.
Only Nemotron supplied a complete reported reasoning-token subtotal. The other
providers' total output counts remain complete.

The Hub revisions identify the catalog snapshots inspected. The routed
providers did not expose a way to pin or verify the exact served weight
revision, so every record states `served_revision_pinned: false`.

Run windows and clean benchmark revisions:

```text
Model              UTC window                         Benchmark commit
Qwen 3.6 35B       2026-07-12 09:09:22–09:14:32       3866ada42483de8f6f133ed627a2e2eaba6f76cd
MiniMax M3         2026-07-12 09:14:32–09:18:57       3866ada42483de8f6f133ed627a2e2eaba6f76cd
Nemotron 3 Ultra   2026-07-12 09:18:57–09:30:54       3866ada42483de8f6f133ed627a2e2eaba6f76cd
Step 3.7 Flash     2026-07-12 09:39:28–09:44:46       9dce7f507e5e767e3bdbae034002d1323fa275b0
```

Raw sample JSONL, profile manifests, and aggregate checkpoints are external:

- `/home/onur/scratch/alman-benchmark-runs/hf-providers/20260712T091500Z-more-hosted-thinking/`
- `/home/onur/scratch/alman-benchmark-runs/hf-providers/20260712T103000Z-step-prefilled-final/`

## What the hosted Qwen result says about the local failure

The hosted Qwen run accepted 30/48, compared with 5/48 for the local
`presence_penalty=1.5` follow-up: a gain of 25 accepted rows, or 52.1 percentage
points. Compliance was unchanged at 36/48. Both used Qwen-recommended
temperature, top-p, top-k, and presence penalty, so presence penalty did not
explain the local 5/48 result.

This is strong evidence that the local failure is specific to the tested local
stack or artifact rather than Qwen 3.6's general ability to perform the task.
It does not isolate one cause: the hosted route used the base Hub repository
with provider-managed serving, while the local run used NVIDIA's NVFP4 artifact
and a pinned local vLLM configuration. Quantization, served weights, chat
templating, reasoning parsing, runtime behavior, or their interaction remain
possible causes.

## Incident record

The initial combined batch completed Qwen, MiniMax, and Nemotron, then stopped
after 19 Step rows. On `curated/die-verwandlung/0`, Step used all 4,096 primary
tokens without content, and the original 2,048-token low-reasoning fallback
also returned no content. Direct probes confirmed that `low`, `none`, and
`off` all still opened mandatory Step reasoning. A continued assistant prefill
then produced a bounded final answer from the exhausted reasoning. The harness
was updated and tested, and Step was rerun from row 1 under the new clean commit;
the 19-row attempt was not mixed into the successful result or cost estimate.

No local inference server or dedicated endpoint was created. No credentials,
raw prompts, raw responses, or model weights are stored in the repository.
`benchmark-results` remains excluded from Jekyll output.

Exact machine-readable records:

- [`2026-07-12-qwen36-35b-hf-deepinfra-thinking.json`](./2026-07-12-qwen36-35b-hf-deepinfra-thinking.json)
- [`2026-07-12-minimax-m3-hf-novita-thinking.json`](./2026-07-12-minimax-m3-hf-novita-thinking.json)
- [`2026-07-12-nemotron3-ultra-hf-together-thinking.json`](./2026-07-12-nemotron3-ultra-hf-together-thinking.json)
- [`2026-07-12-step3.7-flash-hf-deepinfra-thinking.json`](./2026-07-12-step3.7-flash-hf-deepinfra-thinking.json)
- [`2026-07-12-qwen36-35b-thinking-pp15.json`](./2026-07-12-qwen36-35b-thinking-pp15.json)
