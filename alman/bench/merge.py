"""Merge completed AlmanBench range artifacts into one unified result.

Each input directory must contain the standard artifact set written by
``bench-run`` for the same profile. The merger rejects duplicate cases,
configuration drift, scoring drift, and incomplete public-set coverage.
"""

from __future__ import annotations

import argparse
import copy
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from alman.bench.almanbench import case_set_identity
from alman.bench.export import (
    BENCHMARK_ID,
    SCHEMA_VERSION,
    _group_scores,
    _grouped,
    _scoring_revision,
    _write_publication_rows,
    estimated_cost_usd,
    validate_case_rows,
)
from alman.bench.registry import Profile, load_profile
from alman.bench.scoring import is_accepted, lint


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _read_rows(path: Path) -> list[dict[str, Any]]:
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def _same(value: Any, expected: Any, label: str, source: Path) -> None:
    if value != expected:
        raise ValueError(f"{source}: {label} differs between batches")


def merge_artifacts(
    profile: Profile,
    batch_dirs: list[Path],
    out_dir: Path,
    *,
    allow_dirty: bool = False,
) -> dict[str, Any]:
    """Validate and merge finished range artifacts for one full public run."""
    if len(batch_dirs) < 2:
        raise ValueError("merge requires at least two batch directories")

    scoring_revision, dirty = _scoring_revision()
    if dirty and not allow_dirty:
        raise ValueError(
            "the alman working tree is dirty; commit or stash before merging"
        )

    rows: list[dict[str, Any]] = []
    aggregates: list[dict[str, Any]] = []
    inspect_logs: list[str] = []
    expected_model: dict[str, Any] | None = None
    expected_pricing: dict[str, Any] | None = None
    expected_manifest: dict[str, Any] | None = None
    profile_model = {
        "id": profile.name,
        "label": profile.label,
        "requested": profile.requested_model,
        "platform": profile.platform,
        "model_revision": profile.model_revision,
        "runtime": profile.runtime,
        "inspect_model": profile.model,
        "generate": profile.generate,
        "model_args": profile.model_args,
    }

    for batch_dir in batch_dirs:
        samples_path = batch_dir / f"{profile.name}.samples.jsonl"
        result_path = batch_dir / f"{profile.name}.result.json"
        manifest_path = batch_dir / "manifest.json"
        if not all(
            path.is_file() for path in (samples_path, result_path, manifest_path)
        ):
            raise ValueError(f"{batch_dir}: incomplete standard artifact set")

        batch_rows = _read_rows(samples_path)
        aggregate = _read_json(result_path)
        manifest = _read_json(manifest_path)
        if not batch_rows:
            raise ValueError(f"{batch_dir}: batch contains no samples")
        if aggregate.get("case_set_size") != len(batch_rows):
            raise ValueError(f"{batch_dir}: aggregate row count is inconsistent")
        if aggregate.get("benchmark_id") != BENCHMARK_ID:
            raise ValueError(f"{batch_dir}: wrong benchmark id")
        if aggregate.get("model", {}).get("id") != profile.name:
            raise ValueError(f"{batch_dir}: wrong model profile")
        for key, value in profile_model.items():
            if aggregate["model"].get(key) != value:
                raise ValueError(
                    f"{batch_dir}: model configuration differs from the profile"
                )
        if aggregate.get("pricing") != profile.pricing:
            raise ValueError(f"{batch_dir}: pricing differs from the profile")
        if aggregate.get("scoring_revision") != scoring_revision:
            raise ValueError(f"{batch_dir}: scoring revision differs from HEAD")
        if {row.get("scoring_revision") for row in batch_rows} != {scoring_revision}:
            raise ValueError(f"{batch_dir}: sample scoring revisions differ")
        batch_case_set_id = case_set_identity(batch_rows)
        if aggregate.get("case_set_id") != batch_case_set_id:
            raise ValueError(f"{batch_dir}: aggregate case-set identity is wrong")
        if manifest.get("case_set_id") != batch_case_set_id:
            raise ValueError(f"{batch_dir}: manifest case-set identity is wrong")
        for row in batch_rows:
            if row["correct"] != is_accepted(row["output"], row["accepted"]):
                raise ValueError(f"{batch_dir}: stored acceptance score is stale")
            if row["compliant"] != (not lint(row["output"])):
                raise ValueError(f"{batch_dir}: stored compliance score is stale")

        model = aggregate["model"]
        pricing = aggregate.get("pricing")
        manifest_identity = {
            key: manifest.get(key)
            for key in (
                "benchmark_id",
                "scoring_revision",
                "model",
                "model_id",
                "model_revision",
                "runtime",
                "prompt_sha256",
                "inspect_model",
                "max_connections",
            )
        }
        if expected_model is None:
            expected_model = model
            expected_pricing = pricing
            expected_manifest = manifest_identity
        else:
            _same(model, expected_model, "model configuration", batch_dir)
            _same(pricing, expected_pricing, "pricing", batch_dir)
            _same(
                manifest_identity,
                expected_manifest,
                "manifest identity",
                batch_dir,
            )

        rows.extend(batch_rows)
        aggregates.append(aggregate)
        inspect_logs.append(aggregate["artifacts"]["inspect_log"])

    ids = [row["id"] for row in rows]
    if len(ids) != len(set(ids)):
        raise ValueError("batch artifacts contain duplicate sample ids")
    sample_uuids = [row["sample_uuid"] for row in rows]
    if len(sample_uuids) != len(set(sample_uuids)):
        raise ValueError("batch artifacts contain duplicate physical samples")

    execution_ids = list(dict.fromkeys(row["execution_id"] for row in rows))
    rows.sort(key=lambda row: row["id"])
    validate_case_rows(rows, require_full=True)
    case_set_id = case_set_identity(rows)

    starts = [datetime.fromisoformat(item["run"]["started_at"]) for item in aggregates]
    completions = [
        datetime.fromisoformat(item["run"]["completed_at"]) for item in aggregates
    ]
    started = min(starts)
    completed = max(completions)
    started_compact = started.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_id = f"{profile.name}-{BENCHMARK_ID}-{started_compact}"
    for row in rows:
        row["run_id"] = run_id

    tokens = {key: sum(row["tokens"][key] for row in rows) for key in rows[0]["tokens"]}
    duration_seconds = (completed - started).total_seconds()
    artifacts = {
        "inspect_logs": inspect_logs,
        "samples_jsonl": str(out_dir / f"{profile.name}.samples.jsonl"),
    }
    aggregate = {
        "schema_version": SCHEMA_VERSION,
        "benchmark_id": BENCHMARK_ID,
        "case_set_id": case_set_id,
        "case_set_size": len(rows),
        "scoring_revision": scoring_revision,
        "run": {
            "id": run_id,
            "started_at": started.isoformat(),
            "completed_at": completed.isoformat(),
            "latest_execution_id": aggregates[-1]["run"]["latest_execution_id"],
            "execution_ids": execution_ids,
            "status": "success",
        },
        "model": copy.deepcopy(expected_model),
        "results": {
            **_group_scores(rows),
            "tiers": _grouped(
                [{**row, "tier": row["metadata"]["tier"]} for row in rows],
                "tier",
            ),
            "collections": _grouped(rows, "collection"),
            "tokens": tokens,
            "estimated_cost_usd": estimated_cost_usd(
                tokens, expected_pricing, duration_seconds
            ),
            "samples_with_reasoning": sum(row["thinking_observed"] for row in rows),
        },
        "pricing": expected_pricing,
        "artifacts": artifacts,
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
        "model": profile.requested_model,
        "model_id": profile.name,
        "model_revision": profile.model_revision,
        "runtime": profile.runtime,
        "model_args": profile.model_args,
        "logical_run_id": run_id,
        "execution_ids": aggregate["run"]["execution_ids"],
        "started_at": started.isoformat(),
        "completed_at": completed.isoformat(),
        "prompt_sha256": expected_manifest["prompt_sha256"],
        "inspect_model": expected_manifest["inspect_model"],
        "max_connections": expected_manifest["max_connections"],
        "batch_count": len(batch_dirs),
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return aggregate


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("profile", help="profile name from models.yaml")
    parser.add_argument("batches", nargs="+", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument(
        "--force",
        action="store_true",
        help="overwrite an existing merged sample artifact",
    )
    args = parser.parse_args()
    profile = load_profile(args.profile)
    samples_path = args.out / f"{profile.name}.samples.jsonl"
    if samples_path.exists() and not args.force:
        raise SystemExit(
            f"{samples_path} already exists; pass --force or choose another --out"
        )
    aggregate = merge_artifacts(profile, args.batches, args.out)
    print(json.dumps(aggregate["results"], indent=2))
    print(f"merged artifacts: {args.out}")


if __name__ == "__main__":
    main()
