# Benchmark run plan

Plan and runbook for evaluating models on the Standard German → Alman
translation benchmark (`alman/bench/`, built on
[Inspect AI](https://inspect.aisi.org.uk/)).

## What is being measured

The benchmark has two tiers (223 items total):

- **Spec examples** (173 examples, expanding to ~180 items): extracted
  directly from the JSON files under `spec/`. Mostly short phrases, each
  targeting one rule.
- **Curated sentences** (50 items, `alman/bench/curated/`): hand-translated
  full sentences, mostly literary German (Kafka, Hesse), re-derived from the
  `alman-research` seed data under the current spec. These exercise many
  rules at once.

Each run reports two metrics:

- **acceptance** — normalized exact match against the item's acceptance set
  (all spec-valid renderings, enumerated or expanded from a pattern),
  grouped per spec paragraph and per curated collection.
- **compliance** — a linter that flags Standard German surface forms that
  Alman eliminates (unresolved contractions, case-inflected articles, etc.).
  This catches "fluent but non-Alman" output independently of the reference.

The canonical rendering is always the first entry of the acceptance set, so
a stricter canonical-match scorer can be added without touching the data.

## Credentials and model lanes

1. **Direct API (preferred).** Set the provider key and use Inspect's
   built-in providers. For OpenAI:

   ```bash
   set -a; source ~/offline/secrets/elwood_openai_api_key.env; set +a
   ```

   Reasoning effort is passed with the dedicated flag (`--reasoning-effort
   xhigh`), not with `-M` (the `-M` form is forwarded to the client
   constructor and fails on current Inspect versions).

2. **Subscription credentials (Codex / Cursor).** Not implemented yet.
   There is no official raw-completions endpoint for ChatGPT-plan or Cursor
   auth; if needed, the plan is a custom Inspect model provider that wraps
   `codex exec` (supports `model_reasoning_effort=xhigh`) or `cursor-agent`
   one invocation per sample. Scores from agent-harness lanes are not
   strictly comparable to direct API runs and must be tagged as such.

## Run protocol

1. **Smoke test** (2 items, verifies auth, model id, and effort flag):

   ```bash
   uv run inspect eval alman/bench/task.py --model openai/gpt-5.5 \
     --reasoning-effort xhigh --max-connections 1 --limit 2
   ```

2. **Full run** (all 223 items, strictly sequential):

   ```bash
   uv run inspect eval alman/bench/task.py --model openai/gpt-5.5 \
     --reasoning-effort xhigh --max-connections 1
   ```

   Runs are sequential (`--max-connections 1`) by policy: it keeps rate-limit
   behaviour predictable, makes per-item latency visible, and the prompt
   cache (the spec is ~12k tokens of shared prefix) still applies.

3. **Standard variants:**

   ```bash
   -T dataset=curated        # curated tier only (50 items, good shakedown)
   -T dataset=spec           # spec examples only
   -T include_spec=false     # ablation: translate without the spec in context
   -T section=articles       # drill into one spec section
   ```

4. **Inspect results:** logs land in `logs/` (gitignored); browse with
   `uv run inspect view`.

## What to record per run

For every run that is kept, record: model id (exact, e.g.
`gpt-5.5-2026-04-23`), reasoning effort, `include_spec` setting, dataset
tier, date, the git commit of the spec/benchmark, and the two headline
metrics plus the per-group acceptance table. The `.eval` log file contains
all of this; keep the file.

## Planned comparisons

- **gpt-5.5 xhigh, spec in context** — the "informed ceiling": how well a
  frontier model applies the spec when given it verbatim.
- **Same model, `include_spec=false`** — measures how much Alman knowledge
  is latent vs. spec-derived; also the contamination baseline to re-check
  as the spec spreads.
- **Smaller/cheaper models with spec** — the practical translation-engine
  candidates.
- **Fine-tuned models** (via `--model vllm/local -M model_path=...`) — the
  eventual target of the training pipeline; compare against the informed
  ceiling.

## Known caveats

- Acceptance sets on curated genitive-heavy items are pattern-expanded
  (`{der|von die}`), but a few underspecified areas remain judgment calls
  (documented in the items' `note` fields): institutional possessors,
  adverbial genitives, postnominal name genitives, generic *der Mensch*
  pronominalization.
- Compliance lint is surface-form based; it catches eliminated Standard
  German forms but not semantic errors. Acceptance is the primary metric;
  compliance is the floor.
- No sampling controls are pinned (temperature defaults); reasoning models
  are not deterministic across runs. Treat small per-group deltas (< a few
  points) as noise, especially in groups with few items.
