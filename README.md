# Alman: A Simplified Dialect of the German Language

Currently under development. Deployed at [alman.ai](https://alman.ai).

## Translation benchmark

A Standard German → Alman translation benchmark, built on
[Inspect AI](https://inspect.aisi.org.uk/), with two tiers of items:

- **Spec examples** — extracted directly from the JSON files under `spec/`
  (the source of truth), so spec edits propagate to the benchmark
  automatically. Mostly short phrases, each targeting one rule.
- **Curated sentences** (`alman/bench/curated/`) — hand-translated full
  sentences, mostly literary German (Kafka's *Die Verwandlung*, Hesse's
  *Siddhartha* and *Der Steppenwolf*), that exercise many rules at once:
  genitives, contractions, weak nouns, dative plurals, adjective chains.
  Each file records its provenance.

Run it against any model supported by Inspect — the model is a drop-in
parameter:

```bash
uv run inspect eval alman/bench/task.py --model openai/gpt-5-codex
uv run inspect eval alman/bench/task.py --model anthropic/claude-sonnet-4-5
uv run inspect eval alman/bench/task.py --model google/gemini-2.5-pro
uv run inspect eval alman/bench/task.py --model vllm/local -M model_path=./my-finetune
uv run inspect eval alman/bench/task.py --model mockllm/model   # dry run, no API key
```

Set the provider's API key first (e.g. `OPENAI_API_KEY`). Results are written
to `logs/`; browse them with `uv run inspect view`.

Task options (passed with `-T`):

```bash
-T include_spec=false      # translate without the spec in the system prompt
-T dataset=spec            # only spec-derived items (default: all)
-T dataset=curated         # only curated sentence-level items
-T section=articles        # only items from one spec section
-T paragraph=determiners   # only items from one spec paragraph
```

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
