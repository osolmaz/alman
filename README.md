# Alman: A Simplified Dialect of the German Language

Currently under development. Deployed at [alman.ai](https://alman.ai).

## Website

The site is built with [Astro](https://astro.build/) and deployed to GitHub
Pages via `.github/workflows/deploy.yml`:

```bash
npm install
npm run dev       # local dev server
npm run build     # static build into dist/
```

The specification pages render `_includes/spec.md` (English), `spec.de.md`
(German), and `spec.al.md` (Alman), which are generated from the JSON files
under `spec/` (the source of truth) with `uv run python -m alman.build` —
never edit them by hand. Translations live in the `i18n` blocks of the spec
JSON files. The site is served in three language versions (`/`, `/de/`,
`/al/`); localized About pages live in `src/content/about/` (see
`docs/i18n.md` for the language codes and URL scheme). Blog posts
live in `src/content/blog/`, and the visual identity is documented in
`docs/design-guide.md`.

## Translation benchmark

A Standard German → Alman translation benchmark, built on
[Inspect AI](https://inspect.aisi.org.uk/). Its evaluation set is:

The latest [87-row benchmark leaderboard](benchmark-results/2026-07-15-expanded-curated-thinking-comparison.md)
compares 18 model configurations, including the ternary and 1-bit Bonsai 27B
variants.

- **Curated sentences** (`alman/bench/curated/`) — hand-translated full
  sentences, mostly literary German (Kafka's *Die Verwandlung*, Hesse's
  *Siddhartha* and *Der Steppenwolf*), that exercise many rules at once:
  genitives, contractions, weak nouns, dative plurals, adjective chains.
  Each file records its provenance.

The curated tier is kept a **minimum demonstrative set**: every rule in the
spec is the designated target of at least one curated item (a straightforward
demonstration, plus a tricky or guard item where the rule has a trap). Items
declare this with a `covers` field naming spec rule ids, and a test fails if
any rule is left unclaimed. The `regelabdeckung` collection holds the targeted
single-rule items authored to close coverage gaps.

The spec examples are also available as extraction fixtures for scoring and
training-data validation, but they are not evaluation rows when the full spec
is in the model context because the spec contains their answers verbatim. The
curated data contains no spec examples, and the loader rejects any overlap.
Spec examples may be used as a diagnostic only when `include_spec=false`.

Official runs go through the model registry (`alman/bench/models.yaml`),
which pins the Inspect model string, provider environment, generation config,
and observed pricing for each named profile:

```bash
uv run bench-run deepseek-v4-flash              # full 1,025-item public set
uv run bench-run kimi-k2.7-code --limit 3       # smoke test
uv run bench-run glm-5.2 --tiers guards,curated # tier subset
```

The runner delegates execution to Inspect and exports the stable almanbench
artifact set (per-case samples, publication rows, aggregate with per-tier
scores and estimated cost). Adding a model is one registry entry; any
OpenAI-compatible endpoint works, including Hugging Face Inference Providers
(`openai-api/hf/<org>/<model>:<provider>` with `HF_TOKEN`) and dedicated
Inference Endpoints or local servers via `<SERVICE>_BASE_URL`.

For ad-hoc runs, the task itself takes any model supported by Inspect as a
drop-in parameter:

```bash
uv run inspect eval alman/bench/task.py -T dataset=almanbench --model openai/gpt-5-codex
uv run inspect eval alman/bench/task.py -T dataset=almanbench --model anthropic/claude-sonnet-4-5
uv run inspect eval alman/bench/task.py -T dataset=almanbench --model mockllm/model  # dry run
```

Set the provider's API key first (e.g. `OPENAI_API_KEY`). Results are written
to `logs/`; browse them with `uv run inspect view`.

Task options (passed with `-T`):

```bash
-T dataset=almanbench      # the full 1,025-item public set (default: curated)
-T dataset=almanbench -T tiers=guards,curated
-T include_spec=false      # translate without the spec in the system prompt
-T dataset=spec            # diagnostic spec-example run; pair with include_spec=false
-T dataset=spec -T include_spec=false -T section=articles
-T dataset=spec -T include_spec=false -T paragraph=determiners
```

The task rejects `dataset=spec` when `include_spec=true` to prevent answer
leakage.

Two metrics are reported per run: **acceptance** (normalized match against
each item's set of spec-valid renderings, grouped per spec paragraph) and
**compliance** (a linter that flags Standard German surface forms eliminated
by Alman, e.g. unresolved contractions or case-inflected articles).

The extraction and scoring logic is framework-independent
(`alman.bench.dataset`, `alman.bench.scoring`) so it can be reused for
training-data filtering. `alman/bench/overrides.json` patches items whose
spec presentation is not a literal translation pair (e.g. paradigm listings).

Curated items with several independent choice points (e.g. every adnominal
genitive `der` may also be `von die`) state their acceptance set as a compact
pattern instead of enumerating the cross product:

```text
Die Buch {der|von die}@1d Schüler liegt auf die Tisch.
```

`{a|b}` is an alternation (first branch canonical), `[x]` an optional
element, `{g:...}` a linked group whose occurrences must covary (e.g. an
apposition agreeing with the construction chosen for its head), and `@1d`
names the spec rule licensing the alternation. Patterns are expanded at load
time by `alman.bench.pattern.expand_pattern`.
