"""Export an Inspect ``.eval`` log into the stable almanbench artifact set.

The Inspect log is raw evidence with a format owned by Inspect; everything
downstream (leaderboard, rescoring, publication) reads only the artifacts
written here, which follow the almanbench result schema:

- ``<profile>.samples.jsonl``: one row per case, the shape the rescore
  tooling consumes,
- ``<profile>.almanbench-results.jsonl``: flat publication rows (plus a
  parquet twin when pyarrow is installed),
- ``<profile>.result.json``: the aggregate with per-tier and per-collection
  scores, token usage, and estimated cost,
- ``manifest.json``: run identity.

Acceptance and compliance are recomputed here from the stored outputs with
the current scoring code, so ``scoring_revision`` (the alman git HEAD) is
honest. Usage:

    uv run python -m alman.bench.export --log LOG.eval --profile NAME --out DIR
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from inspect_ai.log import EvalLog, EvalSample, read_eval_log
from inspect_ai.model import ContentReasoning

from alman.bench.almanbench import case_set_identity
from alman.bench.registry import Profile
from alman.bench.scoring import is_accepted, lint, split_thinking
from alman.bench.task import almanbench_samples

SCHEMA_VERSION = 1
BENCHMARK_ID = "almanbench-public"
REPO_ROOT = Path(__file__).resolve().parents[2]


def _scoring_revision() -> tuple[str, bool]:
    commit = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    dirty = bool(
        subprocess.run(
            ["git", "status", "--porcelain=v1"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    )
    return commit, dirty


def _completion_parts(sample: EvalSample) -> tuple[str | None, str]:
    """Split a sample's completion into (reasoning, final answer)."""
    content = sample.output.choices[0].message.content
    if isinstance(content, str):
        reasoning, answer = split_thinking(content)
        return reasoning or None, answer
    reasoning_parts: list[str] = []
    text_parts: list[str] = []
    for item in content:
        if isinstance(item, ContentReasoning):
            if item.reasoning.strip():
                reasoning_parts.append(item.reasoning.strip())
        elif hasattr(item, "text"):
            text_parts.append(item.text)
    inline, answer = split_thinking("\n".join(text_parts))
    if inline:
        reasoning_parts.append(inline)
    return ("\n".join(reasoning_parts) or None), answer


def _sample_tokens(sample: EvalSample) -> dict[str, int]:
    """Normalize per-sample usage into disjoint token buckets.

    Inspect's ``ModelUsage`` keeps the buckets disjoint for every provider:
    ``input_tokens`` excludes cache reads and writes (the OpenAI mapping
    subtracts ``cached_tokens`` from ``prompt_tokens``; Anthropic reports
    them separately natively). The exported ``input`` is the sum of the
    three buckets.
    """
    usages = list((sample.model_usage or {}).values())

    def total(field: str) -> int:
        return sum(getattr(usage, field) or 0 for usage in usages)

    uncached = total("input_tokens")
    cache_read = total("input_tokens_cache_read")
    cache_write = total("input_tokens_cache_write")
    return {
        "input": uncached + cache_read + cache_write,
        "uncached_input": uncached,
        "cached_input": cache_read,
        "cache_creation_input": cache_write,
        "output": total("output_tokens"),
        "reasoning": total("reasoning_tokens"),
        "total": total("total_tokens"),
    }


def _score(correct: int, total: int) -> dict[str, int | float]:
    rate = correct / total
    return {
        "correct": correct,
        "total": total,
        "rate": rate,
        "stderr": math.sqrt(rate * (1 - rate) / total),
    }


def _group_scores(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "acceptance": _score(sum(r["correct"] for r in rows), len(rows)),
        "compliance": _score(sum(r["compliant"] for r in rows), len(rows)),
    }


def _grouped(rows: list[dict[str, Any]], key: str) -> dict[str, Any]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        groups[row[key]].append(row)
    return {name: _group_scores(group) for name, group in sorted(groups.items())}


def estimated_cost_usd(
    tokens: dict[str, int], pricing: dict[str, Any] | None
) -> float | None:
    """Token usage priced per the registry (USD per million tokens)."""
    if pricing is None:
        return None
    cached_rate = pricing.get(
        "cached_input_per_million_tokens",
        pricing["uncached_input_per_million_tokens"],
    )
    creation_rate = pricing.get(
        "cache_creation_input_per_million_tokens",
        pricing["uncached_input_per_million_tokens"],
    )
    cost = (
        tokens["uncached_input"] * pricing["uncached_input_per_million_tokens"]
        + tokens["cached_input"] * cached_rate
        + tokens["cache_creation_input"] * creation_rate
        + tokens["output"] * pricing["output_per_million_tokens"]
    ) / 1_000_000
    return round(cost, 5)


def _logged_prompt_sha256(log: EvalLog) -> str:
    """Hash of the system prompt the model actually received.

    Taken from the logged messages, not the current checkout, so re-exports
    of older logs record the prompt that was really used. A retried run that
    mixed prompt revisions is rejected: it is not one benchmark run.
    """
    hashes = set()
    for sample in log.samples or []:
        system = next(m for m in sample.messages if m.role == "system")
        hashes.add(hashlib.sha256(system.text.encode()).hexdigest())
    if len(hashes) != 1:
        raise ValueError(
            "samples were generated with different system prompts; "
            "the log mixes prompt revisions and cannot be one run"
        )
    return hashes.pop()


def _validate_case_coverage(log: EvalLog, rows: list[dict[str, Any]]) -> None:
    ids = [row["id"] for row in rows]
    if len(set(ids)) != len(ids):
        raise ValueError("duplicate sample ids in the log")
    if log.eval.config.limit is not None or log.eval.task_args.get("tiers"):
        return
    expected = {
        sample.id for sample in almanbench_samples(log.eval.task_args.get("bench_dir"))
    }
    if set(ids) != expected:
        missing = sorted(expected - set(ids))[:5]
        unexpected = sorted(set(ids) - expected)[:5]
        raise ValueError(
            f"log does not cover the case set; missing={missing}, "
            f"unexpected={unexpected}"
        )


def export_log(log_path: Path, profile: Profile, out_dir: Path) -> dict[str, Any]:
    """Write the artifact set for a finished run; returns the aggregate."""
    log = read_eval_log(str(log_path))
    if log.status != "success":
        raise ValueError(
            f"log status is {log.status!r}; finish the run first "
            f"(inspect eval-retry {log_path})"
        )
    if log.eval.task_args.get("dataset") != "almanbench":
        raise ValueError("export requires a dataset='almanbench' run")
    if log.eval.task_args.get("include_spec", True) is not True:
        raise ValueError("official artifacts require the spec in context")
    if log.eval.model != profile.model:
        raise ValueError(
            f"log was run with model {log.eval.model!r}, but profile "
            f"{profile.name!r} declares {profile.model!r}"
        )
    logged_config = log.eval.model_generate_config
    for key, value in profile.generate.items():
        logged = getattr(logged_config, key, None)
        if logged != value:
            raise ValueError(
                f"log was generated with {key}={logged!r}, but profile "
                f"{profile.name!r} declares {key}={value!r}"
            )

    scoring_revision, dirty = _scoring_revision()
    if dirty:
        print("WARNING: alman working tree is dirty; scoring_revision is stale")

    execution_id = log.eval.run_id
    started = log.stats.started_at
    completed = log.stats.completed_at
    started_compact = (
        datetime.fromisoformat(started)
        .astimezone(timezone.utc)
        .strftime("%Y%m%dT%H%M%SZ")
    )
    run_id = f"{profile.name}-{BENCHMARK_ID}-{started_compact}"

    rows = []
    for sample in log.samples or []:
        reasoning, answer = _completion_parts(sample)
        sample_tokens = _sample_tokens(sample)
        accepted = (
            list(sample.target)
            if not isinstance(sample.target, str)
            else [sample.target]
        )
        choice = sample.output.choices[0]
        rows.append(
            {
                "id": str(sample.id),
                "source": sample.input,
                "accepted": accepted,
                "collection": sample.metadata["collection"],
                "paragraph": sample.metadata["paragraph"],
                "metadata": {
                    k: v
                    for k, v in sample.metadata.items()
                    if k not in ("collection", "paragraph")
                },
                "output": answer,
                "reasoning": reasoning,
                "reasoning_status": "exposed" if reasoning else "not_exposed",
                "thinking_observed": bool(reasoning)
                or bool(sample_tokens["reasoning"]),
                "forced_final": False,
                "correct": is_accepted(answer, accepted),
                "compliant": not lint(answer),
                "tokens": sample_tokens,
                "finish_reason": choice.stop_reason,
                "returned_model": sample.output.model,
                "run_id": run_id,
                "execution_id": execution_id,
                "scoring_revision": scoring_revision,
                "completed_at": completed,
            }
        )
    rows.sort(key=lambda row: row["id"])
    _validate_case_coverage(log, rows)

    case_set_id = case_set_identity(rows)
    tokens = {key: sum(row["tokens"][key] for row in rows) for key in rows[0]["tokens"]}
    aggregate = {
        "schema_version": SCHEMA_VERSION,
        "benchmark_id": BENCHMARK_ID,
        "case_set_id": case_set_id,
        "case_set_size": len(rows),
        "scoring_revision": scoring_revision,
        "scoring_tree_dirty": dirty,
        "run": {
            "id": run_id,
            "started_at": started,
            "completed_at": completed,
            "latest_execution_id": execution_id,
            "status": "success",
        },
        "model": {
            "id": profile.name,
            "label": profile.label,
            "requested": profile.requested_model,
            "platform": profile.platform,
            "inspect_model": log.eval.model,
            "generate": profile.generate,
        },
        "results": {
            **_group_scores(rows),
            "tiers": _grouped(
                [{**row, "tier": row["metadata"]["tier"]} for row in rows],
                "tier",
            ),
            "collections": _grouped(rows, "collection"),
            "tokens": tokens,
            "estimated_cost_usd": estimated_cost_usd(tokens, profile.pricing),
            "samples_with_reasoning": sum(row["thinking_observed"] for row in rows),
        },
        "pricing": profile.pricing,
        "artifacts": {
            "inspect_log": str(log_path),
            "samples_jsonl": str(out_dir / f"{profile.name}.samples.jsonl"),
        },
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    samples_path = out_dir / f"{profile.name}.samples.jsonl"
    samples_path.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows),
        encoding="utf-8",
    )
    _write_publication_rows(rows, aggregate, profile, out_dir)
    (out_dir / f"{profile.name}.result.json").write_text(
        json.dumps(aggregate, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "benchmark_id": BENCHMARK_ID,
        "case_set_id": case_set_id,
        "case_set_size": len(rows),
        "scoring_revision": scoring_revision,
        "scoring_tree_dirty": dirty,
        "model": profile.requested_model,
        "model_id": profile.name,
        "logical_run_id": run_id,
        "execution_id": execution_id,
        "started_at": started,
        "prompt_sha256": _logged_prompt_sha256(log),
        "inspect_model": log.eval.model,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return aggregate


def _write_publication_rows(
    rows: list[dict[str, Any]],
    aggregate: dict[str, Any],
    profile: Profile,
    out_dir: Path,
) -> None:
    flat = []
    for row in rows:
        flat.append(
            {
                "schema_version": SCHEMA_VERSION,
                "benchmark_id": BENCHMARK_ID,
                "case_set_id": aggregate["case_set_id"],
                "case_set_size": aggregate["case_set_size"],
                "scoring_revision": row["scoring_revision"],
                "sample_id": row["id"],
                "collection": row["collection"],
                "source": row["source"],
                "accepted": row["accepted"],
                "model_id": profile.name,
                "model_label": profile.label,
                "model_name": profile.requested_model,
                "platform": profile.platform,
                "backend": profile.model.split("/")[0],
                "model_revision": None,
                "output": row["output"],
                "reasoning": row["reasoning"],
                "reasoning_summary": None,
                "reasoning_status": row["reasoning_status"],
                "correct": row["correct"],
                "compliant": row["compliant"],
                "thinking_observed": row["thinking_observed"],
                "forced_final": row["forced_final"],
                "returned_model": row["returned_model"],
                "finish_reason": row["finish_reason"],
                "completed_at": row["completed_at"],
                "uncached_input_tokens": row["tokens"]["uncached_input"],
                "cached_input_tokens": row["tokens"]["cached_input"],
                "cache_creation_input_tokens": row["tokens"]["cache_creation_input"],
                "output_tokens": row["tokens"]["output"],
                "reasoning_tokens": row["tokens"]["reasoning"],
                "total_tokens": row["tokens"]["total"],
                "run_id": row["run_id"],
                "execution_id": row["execution_id"],
            }
        )
    results_path = out_dir / f"{profile.name}.almanbench-results.jsonl"
    results_path.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in flat),
        encoding="utf-8",
    )
    try:
        import pyarrow as pa
        import pyarrow.parquet as pq
    except ImportError:
        return
    table = pa.Table.from_pylist(flat)
    pq.write_table(table, results_path.with_suffix(".parquet"))


def main() -> None:
    from alman.bench.registry import load_profile

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--log", type=Path, required=True)
    parser.add_argument("--profile", required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    aggregate = export_log(args.log, load_profile(args.profile), args.out)
    print(json.dumps(aggregate["results"]["acceptance"], indent=2))
    print(f"wrote artifacts to {args.out}")


if __name__ == "__main__":
    main()
