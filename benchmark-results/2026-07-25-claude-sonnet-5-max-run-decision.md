# Claude Sonnet 5 max run decision

The full AlmanBench v0.1 evaluation of Claude Sonnet 5 at max effort will not
be completed or published. The July 25 run was cancelled after 97 successful
cases because live usage projected a total cost of roughly $180 to $220. The
published `claude-sonnet-5-xhigh` result remains the leaderboard entry.

## Observed usage

The run used adaptive thinking, max effort, a 65,536-token output ceiling,
eight concurrent requests, and the full specification in the cached system
prompt. Its 97 successful cases produced 741,767 output tokens. Anthropic
reported 737,862 of those tokens as reasoning.

Claude Opus 5 max produced 33,613 output tokens on the same 97 case IDs, so
Sonnet used 22.1 times as many. The six completed naturalistic cases averaged
27,420.8 output tokens. Projecting that average over the 600-row naturalistic
tier gives $164.53 in output charges before the other tiers and cached input.

The recorded partial-run cost is $8.4499132. Provider billing may include
additional work from requests that were in flight when the client cancelled
them. This number covers the usage represented in the retained log and is not
an account invoice.

## Decision

The small preflight sample did not represent the naturalistic tier. Max effort
allows Sonnet 5 to spend tens of thousands of hidden reasoning tokens on one
translation, and the 65,536-token ceiling is needed to avoid truncating those
responses. Lowering that ceiling would change the evaluation by turning long
responses into failures.

The run must not be resumed or scored as a partial benchmark. A future
maintainer may revisit the decision only after approving a new cost ceiling.
Until then, `xhigh` is the highest completed and published Sonnet 5 setting.

## Preserved artifact

The cancelled Inspect log and a machine-readable partial summary are stored
at:

`hf://buckets/osolmaz/benchmark-runs/runs/almanbench/2026-07-25/claude-sonnet-5-max-partial`

The log retains every recorded prompt, final answer, score, usage count,
provider-exposed reasoning block and signature, and cancellation record.
Anthropic did not expose readable plaintext for the hidden reasoning blocks;
the signed or redacted payloads and token counts are preserved unchanged.
The archive includes SHA-256 checksums and contains no credential or
authorization header.
