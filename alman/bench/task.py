"""Inspect AI task for the Alman translation benchmark.

Run with any model supported by Inspect (the model is fully decoupled from
the task):

    uv run inspect eval alman/bench/task.py --model openai/gpt-5-codex
    uv run inspect eval alman/bench/task.py --model anthropic/claude-sonnet-4-5
    uv run inspect eval alman/bench/task.py --model vllm/local -M model_path=...
    uv run inspect eval alman/bench/task.py --model mockllm/model   # dry run

Task options (pass with -T):

    -T include_spec=false     evaluate without the spec in context
    -T dataset=spec -T include_spec=false
                              diagnostic run on spec examples
    -T dataset=spec -T include_spec=false -T section=articles
                              diagnostic for one spec section
"""

from __future__ import annotations

from inspect_ai import Task, task
from inspect_ai.dataset import MemoryDataset, Sample
from inspect_ai.model import ChatMessageSystem
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

from alman.bench.dataset import REPO_ROOT, BenchItem, load_curated_items, load_items
from alman.bench.scoring import is_accepted, lint

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


@scorer(metrics=[grouped(accuracy(), "paragraph"), stderr()])
def acceptance():
    """Exact match (after normalization) against the item's acceptance set."""

    async def score(state: TaskState, target: Target) -> Score:
        completion = state.output.completion
        correct = is_accepted(completion, list(target))
        return Score(
            value=CORRECT if correct else INCORRECT,
            answer=completion,
            explanation="accepted: " + " | ".join(target),
        )

    return score


@scorer(metrics=[accuracy(), stderr()])
def compliance():
    """Spec-compliance linter: no eliminated Standard German surface forms."""

    async def score(state: TaskState, target: Target) -> Score:
        completion = state.output.completion
        violations = lint(completion)
        return Score(
            value=INCORRECT if violations else CORRECT,
            answer=completion,
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
) -> Task:
    """Translate unseen Standard German sentences to Alman."""
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
        raise ValueError(f"unknown dataset {dataset!r}; use 'spec' or 'curated'")
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
        solver=[translator_system_message(include_spec), generate()],
        scorer=[acceptance(), compliance()],
    )
