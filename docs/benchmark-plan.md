# Benchmark run plan

Plan and runbook for evaluating models on the Standard German → Alman
translation benchmark (`alman/bench/`, built on
[Inspect AI](https://inspect.aisi.org.uk/)).

## What is being measured

The benchmark contains 48 curated, hand-translated sentences under
`alman/bench/curated/`. They are mostly literary German from Kafka and Hesse,
re-derived from the `alman-research` seed data under the current spec. Each
sentence exercises several rules at once.

The 179 examples embedded in the spec are not benchmark rows when the spec is
provided to the model. Their source text and answers both appear verbatim in
the prompt, so scoring them would measure lookup rather than rule application.
The loader automatically discards any curated source/answer pair that also
appears in those examples; two short occupational-title rows are excluded.
They remain available through `dataset=spec` for extraction validation and
no-spec contamination diagnostics, but their scores must not be mixed into a
benchmark headline.

Each run reports two metrics:

- **acceptance** — normalized exact match against the item's acceptance set
  (all spec-valid renderings, enumerated or expanded from a pattern), grouped
  per curated collection.
- **compliance** — a linter that flags Standard German surface forms that
  Alman eliminates (unresolved contractions, case-inflected articles, etc.).
  This catches "fluent but non-Alman" output independently of the reference.

Acceptance is the primary metric; compliance is a minimum quality floor. The
canonical rendering is always the first entry of the acceptance set, so a
stricter canonical-match scorer can be added without changing the data.

## Credentials and model lanes

1. **Direct API (preferred).** Set the provider key and use Inspect's built-in
   providers. Reasoning effort is passed with the dedicated
   `--reasoning-effort` flag, not with `-M`.

2. **Subscription credentials (Codex / Cursor).** Not implemented yet. A
   future custom Inspect provider may wrap `codex exec` or `cursor-agent`, one
   invocation per sample. Agent-harness scores are not strictly comparable to
   direct API runs and must be tagged as such.

## Run protocol

1. **Smoke test** (2 curated items, verifying auth, model id, and effort):

   ```bash
   uv run inspect eval alman/bench/task.py --model openai/gpt-5.5 \
     --reasoning-effort xhigh --max-connections 1 --limit 2
   ```

2. **Full run** (all 48 non-overlapping curated items, strictly sequential):

   ```bash
   uv run inspect eval alman/bench/task.py --model openai/gpt-5.5 \
     --reasoning-effort xhigh --max-connections 1
   ```

   Runs are sequential (`--max-connections 1`) by policy: this keeps
   rate-limit behavior predictable, exposes per-item latency, and still allows
   prompt caching for the roughly 12k-token shared spec prefix.

3. **Standard variants:**

   ```bash
   -T include_spec=false                       # curated no-spec ablation
   -T dataset=spec -T include_spec=false       # diagnostic only; never headline
   ```

4. **Inspect results:** logs land in `logs/` (gitignored); browse them with
   `uv run inspect view`.

## What to record per run

For every retained run, record the exact returned model id, reasoning effort,
`include_spec` setting, date, git commit, acceptance and compliance scores,
per-collection acceptance table, duration, token usage, and `.eval` log path.
Report the evaluated item count explicitly. Never combine spec-example rows
with curated rows in headline metrics.

## Planned comparisons

- **GPT-5.5 xhigh, spec in context** — the informed ceiling on the 48 unseen
  curated sentences.
- **Same model, `include_spec=false`** — measures latent Alman knowledge and
  provides a contamination baseline.
- **Smaller or cheaper models with the spec** — practical translation-engine
  candidates.
- **Fine-tuned models** — the eventual training-pipeline target, compared with
  the curated informed ceiling.

## Known caveats

- Acceptance sets on genitive-heavy items are pattern-expanded (`{der|von
  die}`), but a few underspecified areas remain judgment calls, documented in
  item `note` fields: institutional possessors, adverbial genitives,
  postnominal name genitives, and generic *der Mensch* pronominalization.
- Compliance lint is surface-form based; it catches eliminated Standard
  German forms but not semantic errors.
- Sampling controls are not pinned and reasoning models are not deterministic.
  Treat small per-collection changes as noise, especially for small groups.
