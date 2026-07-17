# Almanbench plan

Almanbench is the Standard German → Alman translation benchmark
(`alman/bench/`, built on [Inspect AI](https://inspect.aisi.org.uk/)). Today it
contains 89 curated, hand-translated items. Version 1 grows it to roughly
1,000 items, large enough to rank models, while keeping the review standard
that makes the references trustworthy. This document covers what the benchmark
measures, how runs are executed, and the plan for building v1.

## Current state

The 89 items under `alman/bench/curated/` are hand-translated. Literary
sentences from Kafka and Hesse (re-derived from the `alman-research` seed data
under the current spec) exercise several rules at once, and targeted
collections (`relativsaetze`, `regelabdeckung`) demonstrate individual rules,
including their tricky cases and overcorrection guards. The curated tier is a
minimum demonstrative set. Every spec rule is claimed by at least one item via
its `covers` field, enforced by `test_every_spec_rule_covered`.

The 179 examples embedded in the spec are not benchmark rows when the spec is
provided to the model. Their source text and answers both appear verbatim in
the prompt, so scoring them would measure lookup instead of rule application.
The curated files contain no spec examples, and the loader fails if an overlap
is introduced. Spec examples remain available through `dataset=spec` for
extraction validation and no-spec contamination diagnostics, but their scores
must never be mixed into a benchmark headline.

## Metrics

Each run reports two metrics:

- **acceptance**: normalized exact match against the item's acceptance set
  (all spec-valid renderings, enumerated or expanded from a pattern), grouped
  per collection.
- **compliance**: a linter that flags Standard German surface forms that
  Alman eliminates (unresolved contractions, case-inflected articles, etc.).
  This catches "fluent but non-Alman" output independently of the reference.

Acceptance is the primary metric and compliance is a minimum quality floor.
The canonical rendering is always the first entry of the acceptance set, so a
stricter canonical-match scorer can be added without changing the data.

## Target size

The v1 target is about 1,000 items. At that size the headline pass rate
carries a 95% confidence interval of roughly ±3 points, which separates models
that differ by 4 points or more. Doubling to 2,000 items would narrow the
interval to ±2 points at twice the review cost, which is the wrong trade for a
first version. Translation benchmarks in the field settled in the same range
(FLORES-200 uses 1,012 sentences per language, WMT test sets run 1,000 to
3,000 pairs).

Reference quality caps what the benchmark can measure. A 2% error rate in the
references makes model differences below 2 points meaningless, so every item
must pass the reference standard described below before it counts.

On top of the public 1,000, a private set of about 200 items guards against
pretraining contamination, as described under public and private sets.

## Data sources

Two sources feed v1.

The first is the `alman-research` sentence corpus
(`samples/significant-1000/sentences-full-10k/`), 10,000 sentences drawn from
841 canonical German works (the significant-1000 manifest), about 12 sentences
per work, 82% prose plus drama and verse, spanning roughly 1500 to 1955 with
its center of mass in 1750–1930. Every row already has a draft Alman
translation. Rows 1–2000 have been through two review passes and a battery of
lexicon-based mechanical checks (`scripts/mechanical_checks.py` in
`alman-research`) and currently report zero flags. A review of the full
corpus is in progress and will eventually correct the remaining rows, so the
benchmark build orders that work instead of adding to it.

The second source is modern German. The corpus above is entirely pre-1955,
and a benchmark dominated by canonical literary prose would measure a
register nobody translates in practice, so the naturalistic tier draws about
half its items from contemporary text: German Wikipedia for formal modern
prose (CC BY-SA), Tatoeba for conversational sentences (CC-BY), and
hand-authored sentences for registers those two miss (instructions, casual
speech, correspondence). These have no draft translations yet; the
model-draft-then-review pipeline that produced the corpus translations
applies to them unchanged.

The third is the existing curated tier of 89 items, which stays as the
modern-register demonstrative core. Its acceptance sets and `covers` tags
carry over unchanged.

## Tier structure

| Tier | Items | Source | Job |
|---|---|---|---|
| Naturalistic | ~600 | ~300 corpus rows from held-out works, ~300 modern-source sentences | Headline score on real prose with interacting rules |
| Targeted | ~200 | Hand-authored (see note below) | Lift rare rules to the coverage floor |
| Guards | ~120 | Mostly hand-authored, modern register | Overcorrection traps |
| Curated | 89 | Existing `alman/bench/curated/` | Modern-register diagnostic core |

The naturalistic tier holds an even balance between canonical and
contemporary German, and reports slice scores by the register flag so the
two halves stay individually readable. The original plan expected most
targeted items to be corpus rows, but coverage measurement during the build
showed the rare rules are rare precisely because natural prose almost never
uses them: the ten under-floor rules together appeared in only a handful of
held-out corpus rows. The targeted tier is therefore fully authored, and the
whole-set modern share runs near 70% while the headline naturalistic tier
stays at 50/50.

## Composition bins

The tiers above break down into concrete bins with exact quotas and
membership conditions. Every condition is checkable by script from the item
metadata, so the finished benchmark can be audited against this table rather
than against intent.

Public set, 1,025 items:

| Bin | Quota | Inclusion conditions |
|---|---|---|
| naturalistic-canonical, pre-1800 | 60 | Corpus row with `work_sha256` on the frozen public held-out list and a work publication year before 1800 |
| naturalistic-canonical, 1800–1899 | 120 | Same, publication year 1800–1899 |
| naturalistic-canonical, 1900–1955 | 120 | Same, publication year 1900–1955 |
| naturalistic-modern, Wikipedia | 120 | German Wikipedia sentence (CC BY-SA) with the article recorded, contemporary orthography |
| naturalistic-modern, Tatoeba | 120 | Tatoeba sentence (CC-BY) with sentence id and contributor recorded |
| naturalistic-modern, authored | 60 | Hand-written, register label from {instructions, casual, correspondence, news} |
| targeted | 216 | Lifts a named rule that was under the 25-floor at selection time, with the tagger confirming the source genuinely exercises that rule. Hand-authored, since the held-out corpus could not supply the rare rules (see the tier structure note). 200 items from the original composition round plus a 16-item top-up for the adverbial-genitive rule (§3c), added to the spec after the freeze |
| guards | 120 | Guard family label from the eight families below, 15 items each |
| curated | 89 | The existing `alman/bench/curated/` collections, unchanged membership |

Within the canonical bins, at least 30 items are drama and at least 15 are
verse, mirroring the corpus genre mix. Works without a resolvable publication
year may fill at most 45 of the 300 canonical slots and are counted in the
period bin their manifest metadata suggests, with the assignment recorded.

There are eight guard families with 15 public items each:

1. predicative adjectives that stay uninflected
2. pronoun-`man` obliques (`einem`, `einen`)
3. prenominal proper-name genitives (`Annas Buch`)
4. quantifier pairs (`nicht`/`nichts`, `viel`/`viele`, comparative `weniger`)
5. plural `-en` that is number rather than case morphology
6. quoted Standard German left untranslated
7. identity items whose source is already valid Alman, so the reference
   equals the source
8. comparison and word-formation `-er`/`-st` forms that keep their endings

Private set, 204 items, mirroring the public proportions:

| Bin | Quota | Inclusion conditions |
|---|---|---|
| naturalistic-canonical | 60 | Corpus rows from works on the frozen private held-out list (disjoint from the public list), periods 12 / 24 / 24 across the three period bins |
| naturalistic-modern | 60 | 24 Wikipedia, 24 Tatoeba, 12 authored, with articles and contributors disjoint from the public set |
| targeted | 44 | Same conditions as public targeted, including a 4-item adverbial-genitive top-up |
| guards | 40 | 5 per guard family |

## Composition audit

The packaged benchmark ships a composition manifest recording each item's
bin, and an audit script verifies the invariants below at the freeze commit
and on every versioned addition. The build is done when the audit passes,
and correctness of composition means exactly this list:

1. Every bin count equals its quota.
2. Every item's metadata satisfies its bin's inclusion conditions.
3. Every spec rule is genuinely exercised by at least 25 public items,
   confirmed by the extended tagger, with the per-rule table emitted.
4. Every reference is clean under the compliance lint and the mechanical-check
   battery, with surviving oddities covered by written exceptions.
5. No item source duplicates another item's source, in either set.
6. No `work_sha256`, Wikipedia article, or Tatoeba contributor appears in
   both the public and private sets, and none of the held-out works appears
   in any training data manifest.
7. No item source or reference matches a spec example (the existing loader
   guarantee, extended to all tiers).
8. Items whose canonical rendering contains a choice site for the
   enumerated choice-point rules (relativizer, pronominal and interrogative
   compounds, interchangeable genitives) carry at least two accepted
   renderings. Items tagged with a choice-point rule whose reference
   contains no such site have no second legal rendering and are exempt.
9. The modern-register share of the naturalistic tier lies between 45% and
   55%. The whole-set share is reported but not bounded, since the fully
   authored targeted tier pushes it up (see the tier structure note).
10. Every public data file contains the canary GUID; no private item text
    appears in any public file.
11. Every acceptance set passes the source-aware reference checks
    (`alman-research/scripts/reference_checks.py`), run over the curated
    tier and both almanbench sets. These checks read the Standard German
    source for unambiguous evidence about what the references must contain,
    so they catch references that are legal Alman strings but the wrong
    answer for their source. The first two check classes are plural
    nominalized adjectives that must keep `-en`, and zero-plural nouns whose
    proven plural licenses the optional `-s` variant.

The tiers answer different questions and are reported separately. The
naturalistic tier gives the headline number. The targeted tier and the
naturalistic tier together feed the per-rule table. Guards are reported as
their own score, because a model can only pass them by knowing what Alman
keeps, and a surface-form stripper will fail them while acing everything else.

## Rule coverage floor

Rules are not sampled equally. In natural text the article rules fire in
nearly every sentence while the optional plural `-s` appears in perhaps one
sentence in two hundred, so equal quotas would either starve the common rules
of realistic contexts or drown the benchmark in synthetic rarities.

The policy is a floor. Every rule in the spec must be genuinely exercised by
at least 25 items across all tiers. Above the floor, frequency is whatever the
naturalistic sample produces. With 25 binary observations the per-rule error
bar is about ±9 points, coarse but sufficient to answer whether a model has
learned a rule at all, since real failures tend to be large.

An item counts toward a rule's floor only when the source contains a form the
rule must transform, or when the item is a guard testing that rule's
overcorrection. Tag presence alone does not count. The tagging comes from the
sampler's `rule_triggers` field, the compliance lint, and the mechanical
checks, extended as described under tooling below.

## Held-out work split

The split is by work, never by row. Sentences from the same book share the
author's constructions and the translator's conventions, so a row-level split
leaks style from training into test and inflates scores.

A measurement on 2026-07-15 showed why this matters here. The corpus sampler
interleaves works, and rows 1–2000 already touch 836 of the 841 works. The
reviewed slice therefore cannot become the benchmark wholesale. Instead,
roughly 50 works are frozen as held out, and all of their rows are taken
wherever they fall in the 10k, about 600 candidate rows in total, of which
about 450 to 500 still need review. The draw covers the corpus share of both
the public and the private set, and because works are the contamination unit,
works that supply private items supply no public items. Modern-source
sentences follow the same discipline at the level of their source: a
Wikipedia article or Tatoeba contributor that supplies private items supplies
no public ones.

The held-out list is stratified so the benchmark mirrors the corpus by period
and genre, is chosen before any training run touches the corpus, and is
recorded in the almanbench data. Reviewed rows from works that are not held
out lose nothing, since they become verified training data.

## Public and private sets

The benchmark ships in two parts. The public set is the roughly 1,000 items
described above, including the curated 89. It is what gives the project
reproducible numbers and lets others evaluate their own models. The private
set is about 200 further items drawn from the same tiers and reviewed to the
same standard, stored outside any public repository (the private
`alman-research` bucket already provides the storage pattern) and never
published in any form.

The private set exists because publication starts a clock. Once the public
items are on GitHub or Hugging Face they enter future training crawls, and
models begin scoring inflated on them without any fine-tuning leak, which is
what happened to GSM8K and motivated private replications like GSM1k and the
ARC-AGI private eval. Alman is partly protected by being rule-derivable from
the public spec, but the `include_spec=false` condition measures latent
knowledge, and that is exactly the number crawl contamination corrupts.

The private set prices this drift. Every evaluated model runs on both sets,
and reports record the public-minus-private gap. A gap that grows over time,
or spikes for one model, is the contamination signal. Guards get private
counterparts with priority, since a published guard is the easiest item to
memorize the trick for.

Every published data file carries a canary GUID (the BIG-bench convention),
so training-data filters can exclude almanbench and so a model can be probed
for having seen it.

## Reference standard

A reference is accepted when the row is clean under the compliance lint and
under the full mechanical-check battery, and any surviving oddity is recorded
in a curated exception with a written reason (the pattern established in
`alman-research/scripts/mechanical_checks.py`, whose exception lists document
why forms like proper-name genitives, `zu Hause`, or the particle `lauter`
are legitimate). Rows 1–2000 of the corpus reached this state through two
manual passes plus four mechanical passes, and held-out rows go through the
same pipeline.

Wherever the spec permits alternatives, the item lists every spec-valid
rendering in its acceptance set, following the existing pattern-expansion
format (`{der|von die}`). The known choice points are the relativizer (`das`
and `die`), the pronominal adverbs (`da`-compounds and preposition plus
pronoun), genitive constructions (retained `der` and periphrastic `von die`),
and the quantifier edge cases documented in the review notes. A reference
that silently encodes one legal choice as the only answer punishes models for
making the other legal choice, and the draft translations were themselves
model-generated, so single-answer scoring would also drift toward that
model's stylistic habits.

## Acceptance-set maintenance

The scorer is strict on purpose: after quote, whitespace, and punctuation
normalization it requires exact, case-sensitive equality with an enumerated
rendering. That design only works if the acceptance sets enumerate everything
the spec licenses, so the sets are maintained under the following rules.

Variants are generated mechanically wherever a choice point can be detected
without false positives. The packager
(`alman-research/scripts/package_almanbench.py`) generates the relativizer
swap, the retained-`der` and `von die` genitive swaps, the `da`- and
`wo`-compound swaps, and the optional plural `-s` renderings. The `-s`
generation is source-aware: it reads the Standard German source for proof
that a zero-plural noun is plural (a dative `-n` form, or a determiner that
cannot precede a masculine or neuter singular) and only then emits the `-s`
variant. Never add these variant families by hand to almanbench items, and
never edit the packaged `almanbench/*.jsonl` files directly; extend the
generator and repackage, so every item benefits and the audit can verify the
result. Curated items are the exception: they use the pattern-expansion
format and their variants are written by hand, with each alternation
annotated with the spec rule that licenses it.

Every rendering variant, generated or hand-written, must be traceable to a
spec rule. If no rule licenses an alternative, it does not go into the
acceptance set, however plausible it looks.

When a model run surfaces a rejected output that looks correct, the
adjudication runs in this order. First check whether the output is licensed
by a spec rule the reference missed; if so, the reference is the bug, and
the fix is to extend the mechanical generator when the pattern is
detectable, or the hand-written pattern when it is not, citing the rule.
If no rule licenses the output, the model is wrong and nothing changes,
regardless of how many strong models produced the same output. Agreement
among models justifies a closer look at the reference, but the deciding
test is always the spec rule.

Surface fidelity is part of the task. Alman is defined as a set of
grammatical transformations applied to a Standard German source; everything
the spec does not transform must be reproduced exactly. Orthographic
modernization of historical sources stays rejected: archaic spellings like
`grade`, `Thür`, or `daß` remain as written, and the dative `-e` in forms
like `zu Hause` or `nach dem Tode` is preserved (the spec's case-ending
elimination applies to the article system and to weak-noun oblique `-n`,
not to fossilized dative `-e` on the noun). Lexical substitutions and
expansions or contractions of abbreviations (`beziehungsweise` rewritten as
`bzw.`, or the reverse) stay rejected, as do case changes: German
capitalization is grammatical, so scoring remains case-sensitive. Model
outputs that modernize, paraphrase, or abbreviate are counted as errors
even when the grammar of the output is impeccable Alman, because the
benchmark measures rule application, not free translation, and a looser
standard would make scores incomparable across models with different
paraphrasing habits.

Any reference change must leave invariant 11 of the composition audit
passing, and stored model runs are rescored after the change to confirm
that nothing moved except the rows the fix was meant to move.

## Guard items

Guards test what Alman keeps. The review history shows that overcorrection is
the characteristic failure of a half-learned model, and of reviewers. The
66k review flagged retained genitive `der`, proper-name genitives like
`Gottes`, and the pronoun `einem` (dative of `man`) as errors when the spec
retains all of them.

Each guard is an item whose correct output preserves something that looks
strippable. The families to cover include predicative adjectives, the
pronoun-`man` obliques (`Das hilft einem sehr`), prenominal proper-name
genitives (`Annas Buch`), the quantifier pairs (`nichts` next to `nicht`,
comparative `weniger`), plural `-en` that is number rather than case
morphology, quoted Standard German that must stay untranslated, and sentences
that are already valid Alman unchanged. An item whose source and correct
output are identical is legitimate and valuable. Most guards are authored by
hand because natural text rarely places the temptation exactly where the test
needs it.

## Item metadata

Every item records its tier, the rules it genuinely exercises (the `covers`
vocabulary of the existing benchmark, 39 tags since the adverbial-genitive
rule was added), the source work identity
(`work_sha256`, author, title, publication year where known), an orthography
flag for archaic spelling, a guard flag, and the acceptance set with the
canonical rendering first. Work identity makes the contamination policy
auditable, and the orthography flag lets reports separate rule failures from
archaic-spelling confusion.

## Tooling to build

Two gaps stand between the current state and the build.

The sampler's `rule_triggers` vocabulary has 13 tags, while the benchmark
rule vocabulary has 39. Floor accounting needs a tagger that detects the
remaining rules from the source text. Most are detectable with the lexicons
and patterns already in `mechanical_checks.py` (weak nouns, two-way
prepositions, superlatives, feminine `-in` forms), so this is an extension
of existing code.

The loader needs to accept the new tiers and metadata while keeping the
existing guarantees, in particular the rejection of any overlap with the 179
spec examples.

The audit script implementing the composition invariants is part of the
deliverable, and the composition manifest is data, so the audit can rerun on
any commit.

## Build sequence

1. Freeze the held-out work list, stratified by period and genre and split
   into public and private works. This is the irreversible step and happens
   before any training run.
2. Extend the rule tagger to the full rule-tag vocabulary and measure
   per-rule coverage of the held-out rows.
3. Review the held-out corpus rows to the reference standard (about 450 to
   500 rows beyond those already reviewed). The ongoing 66k review is already
   moving through the corpus and will reach these rows eventually, so this
   step is a matter of pulling the held-out works forward in the review queue
   and then applying the fix-and-verify pass on top, since the review
   findings are advisory and some get declined against the spec.
4. Collect the modern-source sentences (Wikipedia, Tatoeba, authored), draft
   their translations with the existing pipeline, and review them to the same
   standard.
5. Select targeted top-ups from the remaining corpus for every rule under the
   floor, review them, and author sentences only where the corpus cannot
   supply the rule.
6. Author the guard tier.
7. Add acceptance-set variants across all tiers, package the data with the
   metadata schema and canary GUID, and wire the loader and scorers, keeping
   the private items out of the public repository.
8. Run the composition audit and fix findings until it passes. The audit
   result at the freeze commit is recorded with the release.

Steps 3 through 5 reuse the review pipeline from the 66k review (lint,
mechanical checks, address notes with per-batch row lists).

## Contamination policy

Held-out works are never used for training, in any form. The benchmark rows
are frozen once v1 ships, and growth happens through versioned additions
instead of silent edits. Spec examples stay excluded from scoring for the
reasons given under current state. Corpus texts are public-domain classics and
appear in pretraining data everywhere, which the no-spec ablation
(`include_spec=false`) already measures. The held-out split defends against
fine-tuning leakage, and the private set detects crawl contamination of the
published items, so the two mechanisms cover the two threats independently.

## Credentials and model lanes

1. **Direct API (preferred).** Set the provider key and use Inspect's built-in
   providers. Reasoning effort is passed with the dedicated
   `--reasoning-effort` flag, not with `-M`.

2. **Subscription credentials (Codex / Cursor).** Not implemented yet. A
   future custom Inspect provider may wrap `codex exec` or `cursor-agent`, one
   invocation per sample. Agent-harness scores are not strictly comparable to
   direct API runs and must be tagged as such.

## Run protocol

Official runs go through the standardized runner, which resolves a profile
from the model registry (`alman/bench/models.yaml`), delegates execution to
Inspect, and exports the stable artifact set. Adding a model is one registry
entry (Inspect model string, provider env, generation config, pricing).

1. **Smoke test** (a few items, verifying auth, model id, and effort):

   ```bash
   uv run bench-run <profile> --limit 3
   ```

2. **Full run** (the 1,025-item public set):

   ```bash
   uv run bench-run <profile>
   ```

   Concurrency comes from the profile's `max_connections`. If a run fails
   partway, resume the Inspect log with `inspect eval-retry` and re-export
   with `python -m alman.bench.export`.

3. **Standard variants** (ad-hoc, through the task directly):

   ```bash
   -T include_spec=false                       # no-spec ablation
   -T dataset=spec -T include_spec=false       # diagnostic only; never headline
   ```

4. **Artifacts:** per-case `samples.jsonl`, publication rows, and an
   aggregate `result.json` with per-tier scores, token usage, and estimated
   cost land in `~/scratch/almanbench-runs/<date>/<profile>/`; the raw
   Inspect `.eval` log sits next to them in `logs/`. Acceptance and
   compliance are recomputed from the stored outputs at export time, so the
   recorded `scoring_revision` is the alman commit that scored them.

## Run records

For every retained run, record the exact returned model id, reasoning effort,
`include_spec` setting, date, git commit, acceptance and compliance scores,
per-collection acceptance table, duration, token usage, and `.eval` log path.
Report the evaluated item count explicitly. Never combine spec-example rows
with curated rows in headline metrics.

## Planned comparisons

- **GPT-5.5 xhigh, spec in context**: the informed ceiling on the unseen
  curated sentences.
- **Same model, `include_spec=false`**: measures latent Alman knowledge and
  provides a contamination baseline.
- **Smaller or cheaper models with the spec**: practical translation-engine
  candidates.
- **Fine-tuned models**: the eventual training-pipeline target, compared with
  the informed ceiling.

## Known caveats

- Acceptance sets on genitive-heavy items are pattern-expanded (`{der|von
  die}`), but a few underspecified areas remain judgment calls, documented in
  item `note` fields: institutional possessors, adverbial genitives,
  postnominal name genitives, and generic *der Mensch* pronominalization.
- Compliance lint is surface-form based; it catches eliminated Standard
  German forms but not semantic errors.
- Sampling controls are not pinned and reasoning models are not deterministic.
  Treat small per-collection changes as noise, especially for small groups.
- The canonical corpus is pre-1955 literature, so archaic orthography is
  common in its half of the naturalistic tier. The orthography flag and the
  register slicing keep this visible in reports, and the modern half of the
  benchmark is unaffected.
- Per-rule numbers at the floor of 25 have wide error bars and should be read
  as a learned-or-not verdict, without finer ranking.
- The draft translations were produced by one model family, and although
  review moves them to spec compliance, acceptance-set variants are the main
  defense against residual stylistic bias toward that family.
