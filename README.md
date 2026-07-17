# Alman

Alman is a constructed dialect of German that removes grammatical gender and
most case inflection. The project maintains a formal specification of the
dialect, publishes it in three languages at [alman.ai](https://alman.ai), and
measures how well language models translate Standard German into it with the
Almanbench benchmark.

## Repository layout

The repository holds four things, each in its own top-level directory.

```
spec/                the language: source JSON and the generated spec documents
alman/               Python package: spec compiler, Alman linter, benchmark harness
site/                the alman.ai website (Astro)
benchmark-results/   published leaderboard data and dated run reports
docs/                internal maintainer notes
tests/               one test suite covering the spec, the tooling, and site content
```

## The specification

The JSON files under [`spec/`](spec/) are the source of truth for the
language. Every rule carries its English prose plus `de` (German) and `al`
(Alman) translations in `i18n` blocks. The build step compiles them into the
markdown documents the site renders:

```bash
uv run python -m alman.build
```

This writes `spec/generated/spec.md`, `spec.de.md`, and `spec.al.md`. The
generated files are committed, and they are never edited by hand. The schemas
under [`spec/schemas/`](spec/schemas/) validate the data files, and the test
suite enforces them.

## Website

The site under [`site/`](site/) is built with [Astro](https://astro.build/)
and deployed to GitHub Pages by `.github/workflows/deploy.yml`. It renders
the generated spec documents, the About page, the blog, and the Almanbench
leaderboard, each in three language versions (`/`, `/de/`, `/al/`).

```bash
cd site
npm install
npm run dev       # local dev server
npm run build     # static build into site/dist/
```

Localized content lives in `site/src/content/`. See
[`docs/i18n.md`](docs/i18n.md) for the language codes and the URL scheme, and
[`docs/design-guide.md`](docs/design-guide.md) for the visual identity.

## Almanbench

Almanbench is a Standard German → Alman translation benchmark built on
[Inspect AI](https://inspect.aisi.org.uk/). The v0.1 public set contains
1,028 items across four tiers (naturalistic, targeted, guards, curated) and
is distributed as the Hugging Face dataset
[osolmaz/almanbench](https://huggingface.co/datasets/osolmaz/almanbench).
The current leaderboard is published at
[alman.ai/almanbench](https://alman.ai/almanbench/) from the data in
[`benchmark-results/almanbench-leaderboard.json`](benchmark-results/almanbench-leaderboard.json),
and the per-sample model outputs behind it live in the companion dataset
[osolmaz/almanbench-results](https://huggingface.co/datasets/osolmaz/almanbench-results).

Each run reports **acceptance** (normalized match against the item's set of
spec-valid renderings) and **compliance** (a linter that flags Standard
German surface forms Alman eliminates, such as unresolved contractions or
case-inflected articles).

### Running a model

Official runs go through the model registry
([`alman/bench/models.yaml`](alman/bench/models.yaml)), which pins the
Inspect model string, provider environment, generation config, and observed
pricing for each named profile:

```bash
uv run bench-run deepseek-v4-flash              # full 1,028-item public set
uv run bench-run kimi-k2.7-code --limit 3       # smoke test
uv run bench-run glm-5.2 --tiers guards,curated # tier subset
```

The runner delegates execution to Inspect and exports the stable almanbench
artifact set (per-case samples, publication rows, aggregate with per-tier
scores and estimated cost). Adding a model is one registry entry. Any
OpenAI-compatible endpoint works, including Hugging Face Inference Providers
(`openai-api/hf/<org>/<model>:<provider>` with `HF_TOKEN`) and dedicated
Inference Endpoints or local servers via `<SERVICE>_BASE_URL`.

For ad-hoc runs, the task itself takes any model supported by Inspect as a
drop-in parameter:

```bash
uv run inspect eval alman/bench/task.py -T dataset=almanbench --model openai/gpt-5-codex
uv run inspect eval alman/bench/task.py -T dataset=almanbench --model mockllm/model  # dry run
```

Set the provider's API key first (e.g. `OPENAI_API_KEY`). Results are written
to `logs/` and can be browsed with `uv run inspect view`.

Task options, passed with `-T`:

```bash
-T dataset=almanbench      # the full 1,028-item public set (default: curated)
-T dataset=almanbench -T tiers=guards,curated
-T include_spec=false      # translate without the spec in the system prompt
-T dataset=spec            # diagnostic spec-example run; pair with include_spec=false
-T dataset=spec -T include_spec=false -T section=articles
-T dataset=spec -T include_spec=false -T paragraph=determiners
```

The task rejects `dataset=spec` when `include_spec=true`, because the spec
contains those items' answers verbatim.

### Benchmark data

The packaged tiers live in
[`alman/bench/almanbench/`](alman/bench/almanbench/). The curated tier
([`alman/bench/curated/`](alman/bench/curated/)) consists of hand-translated
full sentences, mostly literary German (Kafka's *Die Verwandlung*, Hesse's
*Siddhartha* and *Der Steppenwolf*), that exercise many rules at once, from
genitives and contractions to weak nouns, dative plurals, and adjective
chains. Each file records its provenance.

The curated tier is kept a minimum demonstrative set. Every rule in the spec
is the designated target of at least one curated item, items declare this
with a `covers` field naming spec rule ids, and a test fails if any rule is
left unclaimed.

Curated items with several independent choice points state their acceptance
set as a compact pattern instead of enumerating the cross product:

```text
Die Buch {der|von die}@1d Schüler liegt auf die Tisch.
```

`{a|b}` is an alternation (first branch canonical), `[x]` an optional
element, `{g:...}` a linked group whose occurrences must covary, and `@1d`
names the spec rule licensing the alternation. Patterns are expanded at load
time by `alman.bench.pattern.expand_pattern`, and the full pattern language
is documented in [`docs/pattern-language.md`](docs/pattern-language.md).

The extraction and scoring logic is framework-independent
(`alman.bench.dataset`, `alman.bench.scoring`) so it can be reused for
training-data filtering. Results from before the v0.1 freeze, such as the
[87-row curated comparison](benchmark-results/2026-07-15-expanded-curated-thinking-comparison.md)
of 18 model configurations, remain in `benchmark-results/` as diagnostic
references.

## Development

The Python tooling is managed with [uv](https://docs.astral.sh/uv/):

```bash
uv sync
uv run pytest
```

The test suite validates the spec data against its schemas, checks benchmark
composition and scoring, and lints every Alman-language page on the site with
the same linter the benchmark uses.
