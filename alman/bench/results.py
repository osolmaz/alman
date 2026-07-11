"""Create and validate portable Alman benchmark result records."""

from __future__ import annotations

import argparse
import json
import math
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from inspect_ai.log import EvalLog, read_eval_log
from inspect_ai.model import ContentReasoning
from jsonschema import Draft202012Validator, FormatChecker

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SCHEMA = REPO_ROOT / "benchmark-results" / "result.schema.json"


def _score(correct: int, total: int) -> dict[str, int | float]:
    rate = correct / total
    return {
        "correct": correct,
        "total": total,
        "rate": rate,
        "stderr": math.sqrt(rate * (1 - rate) / total),
    }


def _is_correct(value: Any) -> bool:
    return value == "C" or value == 1 or value is True


def _thinking_sample_count(log: EvalLog) -> int:
    count = 0
    for sample in log.samples or []:
        if sample.output is None or not sample.output.choices:
            continue
        content = sample.output.choices[0].message.content
        if _has_reasoning_content(content):
            count += 1
    return count


def _has_reasoning_content(content: Any) -> bool:
    if isinstance(content, str):
        return _has_nonempty_think_block(content)
    if not isinstance(content, list):
        return False
    return any(
        (isinstance(item, ContentReasoning) and bool(item.reasoning.strip()))
        or _has_nonempty_think_block(str(getattr(item, "text", "")))
        for item in content
    )


def _has_nonempty_think_block(value: str) -> bool:
    reasoning, _ = raw_thinking_parts(value)
    return bool(reasoning)


def raw_thinking_parts(value: str) -> tuple[str, str]:
    pattern = re.compile(r"<think>(.*?)</think>", flags=re.DOTALL)
    reasoning = "\n".join(
        match.strip() for match in pattern.findall(value) if match.strip()
    )
    final_answer = pattern.sub("", value).strip()
    return reasoning, final_answer


def _score_counts(log: EvalLog, scorer: str) -> tuple[int, int]:
    samples = log.samples or []
    values = [sample.scores[scorer].value for sample in samples]
    return sum(_is_correct(value) for value in values), len(values)


def _group_scores(log: EvalLog) -> dict[str, dict[str, int | float]]:
    groups: dict[str, list[bool]] = defaultdict(list)
    for sample in log.samples or []:
        group = str(sample.metadata["paragraph"])
        groups[group].append(_is_correct(sample.scores["acceptance"].value))
    return {
        group: _score(sum(values), len(values))
        for group, values in sorted(groups.items())
    }


def _token_usage(log: EvalLog) -> dict[str, int | None]:
    usages = list(log.stats.model_usage.values()) if log.stats else []

    def total(field: str) -> int | None:
        values = [getattr(usage, field) for usage in usages]
        present = [value for value in values if value is not None]
        return sum(present) if present else None

    return {
        "input": total("input_tokens") or 0,
        "cached_input": total("input_tokens_cache_read"),
        "output": total("output_tokens") or 0,
        "reasoning": total("reasoning_tokens"),
        "total": total("total_tokens") or 0,
    }


def build_result(
    log_path: Path,
    run_metadata: dict[str, Any],
) -> dict[str, Any]:
    """Combine an Inspect log with the immutable local-run metadata."""
    log = read_eval_log(log_path)
    samples = log.samples or []
    if log.status != "success":
        raise ValueError(f"Inspect log status is {log.status!r}, not 'success'")
    if log.eval.task_args.get("dataset") != "curated":
        raise ValueError("result records only accept the curated dataset")
    if log.eval.task_args.get("include_spec") is not True:
        raise ValueError("result records require the Alman spec in context")
    if len(samples) != 50:
        raise ValueError(f"expected 50 curated samples, found {len(samples)}")

    acceptance_correct, acceptance_total = _score_counts(log, "acceptance")
    compliance_correct, compliance_total = _score_counts(log, "compliance")
    started = datetime.fromisoformat(log.stats.started_at)
    completed = datetime.fromisoformat(log.stats.completed_at)

    result = {
        "$schema": "./result.schema.json",
        "schema_version": 1,
        "run": {
            "id": run_metadata["run_id"],
            "started_at": log.stats.started_at,
            "completed_at": log.stats.completed_at,
            "status": "success",
        },
        "benchmark": {
            "task": log.eval.task,
            "dataset": "curated",
            "sample_count": len(samples),
            "spec_in_context": True,
            "spec_examples_in_dataset": False,
            "commit": log.eval.revision.commit,
            "working_tree_dirty": log.eval.revision.dirty,
            "working_tree_changes": [],
        },
        "model": run_metadata["model"],
        "endpoint": run_metadata["endpoint"],
        "runtime": run_metadata["runtime"],
        "generation": run_metadata["generation"],
        "hardware": run_metadata["hardware"],
        "memory_guard": run_metadata["memory_guard"],
        "results": {
            "duration_seconds": (completed - started).total_seconds(),
            "acceptance": _score(acceptance_correct, acceptance_total),
            "compliance": _score(compliance_correct, compliance_total),
            "groups": _group_scores(log),
            "tokens": _token_usage(log),
            "samples_with_reasoning": _thinking_sample_count(log),
        },
        "artifacts": run_metadata["artifacts"],
    }
    result["model"]["thinking"]["verified_sample_count"] = result["results"][
        "samples_with_reasoning"
    ]
    return result


def validate_result(result: dict[str, Any], schema_path: Path = DEFAULT_SCHEMA) -> None:
    """Validate schema and cross-field invariants."""
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(result)

    for score in [
        result["results"]["acceptance"],
        result["results"]["compliance"],
        *result["results"]["groups"].values(),
    ]:
        expected = score["correct"] / score["total"]
        if not math.isclose(score["rate"], expected, abs_tol=1e-12):
            raise ValueError("score rate does not match correct / total")
        expected_stderr = math.sqrt(expected * (1 - expected) / score["total"])
        if not math.isclose(score["stderr"], expected_stderr, abs_tol=1e-12):
            raise ValueError("score stderr does not match the authoritative counts")
    if result["results"]["acceptance"]["total"] != 50:
        raise ValueError("acceptance total must be 50")
    if result["results"]["compliance"]["total"] != 50:
        raise ValueError("compliance total must be 50")
    dirty = result["benchmark"]["working_tree_dirty"]
    changes = result["benchmark"]["working_tree_changes"]
    if dirty != bool(changes):
        raise ValueError("dirty working-tree state must include identified changes")
    if any(change["affects_benchmark_inputs"] for change in changes):
        raise ValueError("working-tree changes must not affect benchmark inputs")
    if sum(group["total"] for group in result["results"]["groups"].values()) != 50:
        raise ValueError("group totals must sum to 50")
    if (
        sum(group["correct"] for group in result["results"]["groups"].values())
        != result["results"]["acceptance"]["correct"]
    ):
        raise ValueError("group correct counts must sum to acceptance correct")
    verified_reasoning = result["model"]["thinking"]["verified_sample_count"]
    if verified_reasoning < 1:
        raise ValueError("thinking must be observed in at least one evaluated sample")
    if verified_reasoning != result["results"]["samples_with_reasoning"]:
        raise ValueError("duplicated reasoning sample counts must match")
    if (
        result["generation"]["reasoning_token_budget"]
        >= result["generation"]["max_tokens"]
    ):
        raise ValueError("reasoning token budget must leave room for a final answer")
    if result["memory_guard"]["pressure_kill_occurred"]:
        raise ValueError("a pressure-killed run is not a valid benchmark result")


def write_result(result: dict[str, Any], output_path: Path) -> None:
    validate_result(result)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("result", type=Path, help="result JSON file to validate")
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    args = parser.parse_args()
    result = json.loads(args.result.read_text(encoding="utf-8"))
    validate_result(result, args.schema)
    print(f"Valid benchmark result: {args.result}")


if __name__ == "__main__":
    main()
