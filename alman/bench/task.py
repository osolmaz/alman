"""Inspect AI task for the Alman translation benchmark.

Run with any model supported by Inspect (the model is fully decoupled from
the task):

    uv run inspect eval alman/bench/task.py --model openai/gpt-5-codex
    uv run inspect eval alman/bench/task.py --model anthropic/claude-sonnet-4-5
    uv run inspect eval alman/bench/task.py --model vllm/local -M model_path=...
    uv run inspect eval alman/bench/task.py --model mockllm/model   # dry run

Task options (pass with -T):

    -T dataset=almanbench     the full public case set (curated + packaged)
    -T dataset=almanbench -T tiers=guards,curated
                              a tier subset, e.g. for smoke runs
    -T include_spec=false     evaluate without the spec in context
    -T dataset=spec -T include_spec=false
                              diagnostic run on spec examples
    -T dataset=spec -T include_spec=false -T section=articles
                              diagnostic for one spec section

Registry-driven runs (model config, artifacts, cost) go through
``uv run bench-run <profile>``; see ``alman/bench/run.py``.
"""

from __future__ import annotations

from pathlib import Path

from inspect_ai import Task, task
from inspect_ai.dataset import MemoryDataset, Sample
from inspect_ai.model import ChatMessageSystem, ChatMessageUser
from inspect_ai.scorer import (
    CORRECT,
    INCORRECT,
    Score,
    Target,
    accuracy,
    grouped,
    scorer,
    stderr,
)
from inspect_ai.solver import Generate, TaskState, generate, solver

from alman.bench.almanbench import AlmanbenchItem, load_almanbench_items
from alman.bench.dataset import REPO_ROOT, BenchItem, load_curated_items, load_items
from alman.bench.scoring import is_accepted, lint, split_thinking

SPEC_MARKDOWN = REPO_ROOT / "_includes" / "spec.md"

INSTRUCTIONS = """\
You are a translator from Standard German to Alman, a simplified dialect of \
German that eliminates grammatical gender and most case inflection.

Translate the text given by the user into Alman, following these rules:
- Output only the Alman translation: no explanations, no quotation marks, no labels.
- Parenthetical annotations such as "(Dative)" or "(plural)" are grammatical \
context for you; do not translate or repeat them.
- If the input lists several Standard German forms (for example a paradigm \
like "dieser, dieses, diesem"), output the corresponding Alman form or forms.
- Preserve the capitalization and punctuation style of the input.
"""

SPEC_PREAMBLE = """
The full Alman specification follows. Apply it exactly.

<specification>
{spec}
</specification>
"""


def _system_prompt(include_spec: bool) -> str:
    prompt = INSTRUCTIONS
    if include_spec:
        prompt += SPEC_PREAMBLE.format(spec=SPEC_MARKDOWN.read_text(encoding="utf-8"))
    return prompt


@solver
def translator_system_message(include_spec: bool = True):
    """Insert the system prompt without template interpolation.

    The spec markdown contains literal braces (e.g. ``{#introduction}``), so
    the built-in ``system_message`` solver's ``str.format`` call would fail.
    """
    content = _system_prompt(include_spec)

    async def solve(state: TaskState, generate: Generate) -> TaskState:
        state.messages.insert(0, ChatMessageSystem(content=content))
        return state

    return solve


FORCED_FINAL_PROMPT = (
    "Your previous response contained no final translation. "
    "Output only the final Alman translation now, with no reasoning, "
    "no explanations, and no quotation marks."
)

FORCED_FINAL_MAX_TOKENS = 2048


@solver
def forced_final():
    """Recover a final answer when reasoning exhausted the output budget.

    Reasoning models sometimes spend the entire ``max_tokens`` budget on
    thinking and return no final text. Scoring the empty answer would
    understate the model, so one follow-up call asks for the final
    translation only, with reasoning disabled when the run configured a
    reasoning effort; the sample is marked ``forced_final`` for the
    exporter. If the fallback also returns no text, the empty answer is
    scored as is (incorrect).
    """
    from inspect_ai.model._generate_config import active_generate_config

    async def solve(state: TaskState, generate: Generate) -> TaskState:
        _, answer = split_thinking(state.output.completion)
        if answer.strip():
            return state
        state.messages.append(ChatMessageUser(content=FORCED_FINAL_PROMPT))
        overrides: dict = {"max_tokens": FORCED_FINAL_MAX_TOKENS}
        if active_generate_config().reasoning_effort is not None:
            overrides["reasoning_effort"] = "none"
        state = await generate(state, **overrides)
        state.metadata["forced_final"] = True
        return state

    return solve


def _sample(item: BenchItem) -> Sample:
    return Sample(
        id=item.id,
        input=item.source,
        target=item.accepted,
        metadata={
            "section": item.section,
            "paragraph": item.paragraph,
            "rule": item.rule,
            "note": item.note,
            "english": item.english,
            "provenance": item.provenance,
        },
    )


def _curated_almanbench_sample(item: BenchItem) -> Sample:
    """A curated item as a row of the full almanbench case set."""
    return Sample(
        id=item.id,
        input=item.source,
        target=item.accepted,
        metadata={
            "tier": "curated",
            "collection": item.paragraph,
            "paragraph": "curated",
            "bin": "curated",
            "set": "public",
            "guard": False,
        },
    )


def _packaged_almanbench_sample(item: AlmanbenchItem) -> Sample:
    return Sample(
        id=item.id,
        input=item.source,
        target=item.accepted,
        metadata={
            "tier": item.tier,
            "collection": item.tier,
            "paragraph": item.tier,
            "bin": item.bin,
            "set": item.set,
            "guard": item.guard,
            "guard_family": item.guard_family,
            "covers": item.covers,
            "register": item.register_label,
            "orthography_archaic": item.orthography_archaic,
            "work": item.work,
        },
    )


def almanbench_samples(bench_dir: str | None = None) -> list[Sample]:
    """The almanbench case set.

    The public set is the curated tier plus the packaged public tiers.
    ``bench_dir`` selects a different packaged directory (the private set
    uses the same layout outside this repository); the public curated items
    are not mixed in then, since the private set must stay disjoint from the
    public one for the contamination comparison to mean anything.
    """
    if bench_dir is not None:
        return [
            _packaged_almanbench_sample(item)
            for item in load_almanbench_items(Path(bench_dir))
        ]
    samples = [_curated_almanbench_sample(item) for item in load_curated_items()]
    samples += [_packaged_almanbench_sample(item) for item in load_almanbench_items()]
    return samples


@scorer(metrics=[grouped(accuracy(), "paragraph"), stderr()])
def acceptance():
    """Exact match (after normalization) against the item's acceptance set."""

    async def score(state: TaskState, target: Target) -> Score:
        _, answer = split_thinking(state.output.completion)
        correct = is_accepted(answer, list(target))
        return Score(
            value=CORRECT if correct else INCORRECT,
            answer=answer,
            explanation="accepted: " + " | ".join(target),
        )

    return score


@scorer(metrics=[accuracy(), stderr()])
def compliance():
    """Spec-compliance linter: no eliminated Standard German surface forms."""

    async def score(state: TaskState, target: Target) -> Score:
        _, answer = split_thinking(state.output.completion)
        violations = lint(answer)
        return Score(
            value=INCORRECT if violations else CORRECT,
            answer=answer,
            explanation="; ".join(violations) if violations else "no violations",
        )

    return score


@task
def alman_bench(
    include_spec: bool = True,
    dataset: str = "curated",
    section: str | None = None,
    paragraph: str | None = None,
    paragraphs: str | list[str] | None = None,
    tiers: str | list[str] | None = None,
    bench_dir: str | None = None,
) -> Task:
    """Translate unseen Standard German sentences to Alman."""
    if dataset == "almanbench":
        if section is not None or paragraph is not None or paragraphs is not None:
            raise ValueError(
                "dataset='almanbench' filters by tier; use tiers=..., not "
                "section/paragraph/paragraphs"
            )
        samples = almanbench_samples(bench_dir)
        if tiers is not None:
            values = tiers.split(",") if isinstance(tiers, str) else tiers
            selected = {value.strip() for value in values if value.strip()}
            known = {sample.metadata["tier"] for sample in samples}
            if not selected or not selected <= known:
                raise ValueError(f"tiers must be a subset of {sorted(known)}")
            samples = [s for s in samples if s.metadata["tier"] in selected]
        return Task(
            dataset=MemoryDataset(samples=samples, name="alman-bench-almanbench"),
            solver=[
                translator_system_message(include_spec),
                generate(),
                forced_final(),
            ],
            scorer=[acceptance(), compliance()],
        )
    if tiers is not None or bench_dir is not None:
        raise ValueError("tiers and bench_dir apply only to dataset='almanbench'")
    if dataset == "spec":
        if include_spec:
            raise ValueError(
                "dataset='spec' leaks its answers when include_spec=true; "
                "set include_spec=false"
            )
        items = load_items()
    elif dataset == "curated":
        items = load_curated_items()
    else:
        raise ValueError(
            f"unknown dataset {dataset!r}; use 'almanbench', 'curated', or 'spec'"
        )
    if section is not None:
        items = [item for item in items if item.section == section]
    if paragraph is not None:
        items = [item for item in items if item.paragraph == paragraph]
    if paragraphs is not None:
        values = paragraphs.split(",") if isinstance(paragraphs, str) else paragraphs
        selected = {value.strip() for value in values if value.strip()}
        if not selected:
            raise ValueError("paragraphs must name at least one collection")
        items = [item for item in items if item.paragraph in selected]
    if not items:
        raise ValueError("no benchmark items match the given filters")

    return Task(
        dataset=MemoryDataset(
            samples=[_sample(item) for item in items],
            name=f"alman-bench-{dataset}",
        ),
        solver=[translator_system_message(include_spec), generate(), forced_final()],
        scorer=[acceptance(), compliance()],
    )
