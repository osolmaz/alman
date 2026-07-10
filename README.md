# Alman: A Simplified Dialect of the German Language

Currently under development. Deployed at [alman.ai](https://alman.ai).

## Translation benchmark

The spec's curated example pairs double as a Standard German → Alman
translation benchmark, built on [Inspect AI](https://inspect.aisi.org.uk/).
Items are extracted directly from the JSON files under `spec/` (the source of
truth), so spec edits propagate to the benchmark automatically.

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
-T section=articles        # only items from one spec section
-T paragraph=determiners   # only items from one spec paragraph
```

Three metrics are reported per run: **acceptance** (normalized match against
each item's set of spec-valid renderings, grouped per spec paragraph),
**canonical** (exact match against the spec-preferred rendering only, i.e.
style adherence), and **compliance** (a linter that flags Standard German
surface forms eliminated by Alman, e.g. unresolved contractions or
case-inflected articles).

The extraction and scoring logic is framework-independent
(`alman.bench.dataset`, `alman.bench.scoring`) so it can be reused for
training-data filtering. `alman/bench/overrides.json` patches items whose
spec presentation is not a literal translation pair (e.g. paradigm listings)
and widens acceptance sets with renderings the spec text licenses but the
example tables omit (periphrastic `von die` genitives, optional plural `-s`,
ditransitive order alternatives).
