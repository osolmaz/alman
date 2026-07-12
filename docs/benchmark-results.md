# Benchmark results

## 2026-07-11: GPT-5.5 xhigh with the specification

This is the curated-only informed-ceiling baseline from the
[benchmark plan](benchmark-plan.md). It was filtered from a completed run that
also contained 179 explicit spec-example rows. Two additional curated rows were
found to duplicate spec examples and are also discarded here; each sample is
independent.

| Setting | Value |
| --- | --- |
| Model requested | `openai/gpt-5.5` |
| Model returned | `gpt-5.5-2026-04-23` |
| Reasoning effort | `xhigh` |
| Specification in context | Yes |
| Raw curated rows | 50 |
| Evaluated dataset | 48 curated items after excluding 2 overlaps |
| Connections | 1 |
| Repository commit | `f2de2cc` (clean) |
| Curated subset started | 2026-07-11 05:10 SGT |
| Curated subset duration | 22m 25s |

### Headline results

| Metric | Result |
| --- | ---: |
| Acceptance | 45/48 (93.8%) |
| Compliance | 48/48 (100.0%) |

### Acceptance by collection

| Collection | Accepted | Rate |
| --- | ---: | ---: |
| ablaut | 2/2 | 100.0% |
| berufe | 5/5 | 100.0% |
| deutsch-alman | 11/11 | 100.0% |
| die-verwandlung | 3/4 | 75.0% |
| siddhartha | 15/16 | 93.8% |
| starke-flexion | 8/8 | 100.0% |
| steppenwolf | 1/2 | 50.0% |

The three acceptance failures were:

- `curated/die-verwandlung/2`: used `irgendeine Besorgung` instead of the
  accepted `irgendein Besorgung`.
- `curated/siddhartha/2`: used `der Gelehrte` instead of the accepted Alman
  article form `die Gelehrte`.
- `curated/steppenwolf/0`: diverged from the acceptance set in demonstrative
  and pronoun choices.

The 48 evaluated rows used 674,541 total tokens: 19,537 uncached input tokens,
577,536 cached input tokens, and 77,468 output tokens, including 75,919
reasoning tokens. The two discarded requests account for the difference from
the raw run totals.

The source Inspect log is retained locally at
`logs/2026-07-10T20-59-22-00-00_alman-bench_B9AC5hZQnPr2rbT9WePck4.eval`.
The `logs/` directory is gitignored. Do not report the full-run aggregate;
it includes the discarded spec-example rows.
