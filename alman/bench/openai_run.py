"""Run the curated Alman benchmark through the OpenAI Chat Completions API."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from openai import OpenAI

from alman.bench.dataset import load_curated_items
from alman.bench.hf_run import (
    _append_jsonl,
    _artifact_batch_dir,
    _external_artifact_root,
    _git_revision,
    _load_jsonl,
    _refresh_completed_samples,
    _rewrite_jsonl,
    _resumed_benchmark_commit,
    _score,
    _write_json,
)
from alman.bench.scoring import is_accepted, lint
from alman.bench.task import _system_prompt

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "benchmark-results" / "openai-result.schema.json"
THINKING_MAX_TOKENS = 4096
FORCED_FINAL_MAX_TOKENS = 512
MODEL_METADATA = {
    "gpt-5.4-mini-2026-03-17": ("GPT-5.4 mini", 0.75, 0.075, 4.5),
    "gpt-5.6-luna": ("GPT-5.6 Luna", 1.0, 0.1, 6.0),
    "gpt-5.6-sol": ("GPT-5.6 Sol", 5.0, 0.5, 30.0),
    "gpt-5.6-terra": ("GPT-5.6 Terra", 2.5, 0.25, 15.0),
}
SUPPORTED_MODELS = set(MODEL_METADATA)
PROFILE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "name",
        "model",
        "label",
        "reasoning_effort",
        "forced_final_reasoning_effort",
        "max_concurrency",
        "input_price_per_million",
        "cached_input_price_per_million",
        "output_price_per_million",
        "pricing_observed_at",
        "output",
    ],
    "properties": {
        "name": {"type": "string", "pattern": "^[a-z0-9][a-z0-9._-]+$"},
        "model": {"enum": sorted(SUPPORTED_MODELS)},
        "label": {"type": "string", "minLength": 1},
        "reasoning_effort": {"const": "xhigh"},
        "forced_final_reasoning_effort": {"const": "none"},
        "max_concurrency": {"type": "integer", "minimum": 1, "maximum": 8},
        "input_price_per_million": {"type": "number", "minimum": 0},
        "cached_input_price_per_million": {"type": "number", "minimum": 0},
        "output_price_per_million": {"type": "number", "minimum": 0},
        "pricing_observed_at": {"type": "string", "format": "date-time"},
        "output": {"type": "string", "pattern": "^[^/]+\\.json$"},
    },
}


def _validate_profiles(profiles: list[dict[str, Any]]) -> None:
    validator = Draft202012Validator(
        PROFILE_SCHEMA,
        format_checker=FormatChecker(),
    )
    for profile in profiles:
        validator.validate(profile)
        expected = MODEL_METADATA[profile["model"]]
        observed = (
            profile["label"],
            profile["input_price_per_million"],
            profile["cached_input_price_per_million"],
            profile["output_price_per_million"],
        )
        if observed != expected:
            raise ValueError("OpenAI profile label or pricing does not match the model")
        if (
            profile["cached_input_price_per_million"]
            > profile["input_price_per_million"]
        ):
            raise ValueError("cached input price cannot exceed the input price")
    for field in ("name", "model", "output"):
        values = [profile[field] for profile in profiles]
        if len(values) != len(set(values)):
            raise ValueError(f"OpenAI profile {field} values must be unique")


def _response_data(response: Any) -> dict[str, Any]:
    choice = response.choices[0]
    usage = response.usage
    prompt_details = getattr(usage, "prompt_tokens_details", None)
    completion_details = getattr(usage, "completion_tokens_details", None)
    return {
        "response_id": response.id,
        "returned_model": response.model,
        "finish_reason": choice.finish_reason,
        "content": (choice.message.content or "").strip(),
        "tokens": {
            "input": usage.prompt_tokens,
            "cached_input": (
                getattr(prompt_details, "cached_tokens", 0) or 0
                if prompt_details is not None
                else 0
            ),
            "output": usage.completion_tokens,
            "reasoning": (
                getattr(completion_details, "reasoning_tokens", 0) or 0
                if completion_details is not None
                else 0
            ),
            "total": usage.total_tokens,
        },
    }


def _request(
    client: OpenAI,
    *,
    model: str,
    messages: list[dict[str, str]],
    max_completion_tokens: int,
    reasoning_effort: str,
    retries: int = 2,
) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_completion_tokens=max_completion_tokens,
                reasoning_effort=reasoning_effort,
            )
            return _response_data(response)
        except Exception as error:
            last_error = error
            if attempt == retries:
                break
            time.sleep(2**attempt)
    raise RuntimeError(
        f"OpenAI inference failed after {retries + 1} attempts"
    ) from last_error


def _run_sample(client: OpenAI, profile: dict[str, Any], item: Any) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": _system_prompt(True)},
        {"role": "user", "content": item.source},
    ]
    primary = _request(
        client,
        model=profile["model"],
        messages=messages,
        max_completion_tokens=THINKING_MAX_TOKENS,
        reasoning_effort=profile["reasoning_effort"],
    )
    forced_final = not bool(primary["content"])
    fallback = None
    output = primary["content"]
    if forced_final:
        fallback = _request(
            client,
            model=profile["model"],
            messages=[
                *messages,
                {
                    "role": "user",
                    "content": (
                        "The reasoning budget is exhausted. Do not analyze. "
                        "Return only the final Alman translation now."
                    ),
                },
            ],
            max_completion_tokens=FORCED_FINAL_MAX_TOKENS,
            reasoning_effort=profile["forced_final_reasoning_effort"],
        )
        if fallback["tokens"]["reasoning"]:
            raise RuntimeError(
                f"forced-final request used reasoning tokens for {item.id}"
            )
        output = fallback["content"]
        if not output:
            raise RuntimeError(f"forced-final request returned no answer for {item.id}")

    tokens = primary["tokens"].copy()
    if fallback is not None:
        for field in tokens:
            tokens[field] += fallback["tokens"][field]

    return {
        "id": item.id,
        "source": item.source,
        "accepted": item.accepted,
        "paragraph": item.paragraph,
        "output": output,
        "thinking_observed": primary["tokens"]["reasoning"] > 0,
        "forced_final": forced_final,
        "correct": is_accepted(output, item.accepted),
        "compliant": not lint(output),
        "tokens": tokens,
        "primary_completion_tokens": primary["tokens"]["output"],
        "primary_reasoning_tokens": primary["tokens"]["reasoning"],
        "primary": {
            key: primary[key]
            for key in ("response_id", "returned_model", "finish_reason")
        },
        "fallback": (
            {
                key: fallback[key]
                for key in ("response_id", "returned_model", "finish_reason")
            }
            if fallback is not None
            else None
        ),
    }


def _aggregate(
    *,
    profile: dict[str, Any],
    samples: list[dict[str, Any]],
    started_at: str,
    completed_at: str,
    commit: str,
    artifact_path: Path,
) -> dict[str, Any]:
    groups: dict[str, list[bool]] = defaultdict(list)
    for sample in samples:
        groups[sample["paragraph"]].append(sample["correct"])
    token_totals = {
        field: sum(sample["tokens"][field] for sample in samples)
        for field in ("input", "cached_input", "output", "reasoning", "total")
    }
    uncached_input = token_totals["input"] - token_totals["cached_input"]
    estimated_cost = (
        uncached_input * profile["input_price_per_million"]
        + token_totals["cached_input"] * profile["cached_input_price_per_million"]
        + token_totals["output"] * profile["output_price_per_million"]
    ) / 1e6
    result = {
        "$schema": "./openai-result.schema.json",
        "schema_version": 1,
        "run": {
            "id": (
                f"{started_at.replace('-', '').replace(':', '')[:15]}Z-"
                f"{profile['name']}"
            ),
            "started_at": started_at,
            "completed_at": completed_at,
            "status": "success",
        },
        "benchmark": {
            "task": "alman_bench",
            "dataset": "curated",
            "sample_count": len(samples),
            "spec_in_context": True,
            "spec_examples_in_dataset": False,
            "commit": commit,
            "working_tree_dirty": False,
        },
        "model": {
            "requested": profile["model"],
            "label": profile["label"],
            "returned_models": sorted(
                {sample["primary"]["returned_model"] for sample in samples}
                | {
                    sample["fallback"]["returned_model"]
                    for sample in samples
                    if sample["fallback"] is not None
                }
            ),
            "snapshot_pinned": "-2026-" in profile["model"],
            "reasoning": {
                "enabled": True,
                "effort": profile["reasoning_effort"],
                "primary_call_max_completion_tokens": THINKING_MAX_TOKENS,
                "samples_with_reasoning": sum(
                    sample["thinking_observed"] for sample in samples
                ),
                "max_primary_completion_tokens": max(
                    sample["primary_completion_tokens"] for sample in samples
                ),
                "max_primary_reasoning_tokens": max(
                    sample["primary_reasoning_tokens"] for sample in samples
                ),
                "forced_final_fallback_count": sum(
                    sample["forced_final"] for sample in samples
                ),
                "forced_final_effort": profile["forced_final_reasoning_effort"],
            },
        },
        "endpoint": {
            "platform": "openai-api",
            "provider": "openai",
            "api": "chat_completions",
            "max_concurrency": profile["max_concurrency"],
        },
        "generation": {
            "primary_max_completion_tokens": THINKING_MAX_TOKENS,
            "forced_final_max_completion_tokens": FORCED_FINAL_MAX_TOKENS,
            "max_retries": 2,
        },
        "results": {
            "acceptance": _score(
                sum(sample["correct"] for sample in samples), len(samples)
            ),
            "compliance": _score(
                sum(sample["compliant"] for sample in samples), len(samples)
            ),
            "groups": {
                group: _score(sum(values), len(values))
                for group, values in sorted(groups.items())
            },
            "tokens": token_totals,
            "estimated_cost_usd": estimated_cost,
        },
        "pricing": {
            "currency": "USD",
            "input_per_million_tokens": profile["input_price_per_million"],
            "cached_input_per_million_tokens": profile[
                "cached_input_price_per_million"
            ],
            "output_per_million_tokens": profile["output_price_per_million"],
            "observed_at": profile["pricing_observed_at"],
        },
        "artifacts": {"samples_jsonl": str(artifact_path)},
    }
    validate_openai_result(result)
    return result


def validate_openai_result(result: dict[str, Any]) -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(result)
    expected = MODEL_METADATA[result["model"]["requested"]]
    observed = (
        result["model"]["label"],
        result["pricing"]["input_per_million_tokens"],
        result["pricing"]["cached_input_per_million_tokens"],
        result["pricing"]["output_per_million_tokens"],
    )
    if observed != expected:
        raise ValueError("OpenAI result label or pricing does not match the model")
    snapshot_pinned = "-2026-" in result["model"]["requested"]
    if result["model"]["snapshot_pinned"] != snapshot_pinned:
        raise ValueError("snapshot_pinned does not match the requested model")
    sample_count = result["benchmark"]["sample_count"]
    scores = [
        result["results"]["acceptance"],
        result["results"]["compliance"],
        *result["results"]["groups"].values(),
    ]
    for score in scores:
        expected = score["correct"] / score["total"]
        if not math.isclose(score["rate"], expected, abs_tol=1e-12):
            raise ValueError("score rate does not match its counts")
        stderr = math.sqrt(expected * (1 - expected) / score["total"])
        if not math.isclose(score["stderr"], stderr, abs_tol=1e-12):
            raise ValueError("score stderr does not match its counts")
    if any(score["total"] != sample_count for score in scores[:2]):
        raise ValueError("headline score totals must match the sample count")
    if (
        sum(score["total"] for score in result["results"]["groups"].values())
        != sample_count
    ):
        raise ValueError("group totals must match the sample count")
    if (
        sum(score["correct"] for score in result["results"]["groups"].values())
        != result["results"]["acceptance"]["correct"]
    ):
        raise ValueError("group correct counts must match headline acceptance")
    tokens = result["results"]["tokens"]
    if tokens["cached_input"] > tokens["input"]:
        raise ValueError("cached input cannot exceed total input")
    if tokens["reasoning"] > tokens["output"]:
        raise ValueError("reasoning tokens cannot exceed total output")
    if tokens["input"] + tokens["output"] != tokens["total"]:
        raise ValueError("input and output tokens must sum to total tokens")
    uncached_input = tokens["input"] - tokens["cached_input"]
    expected_cost = (
        uncached_input * result["pricing"]["input_per_million_tokens"]
        + tokens["cached_input"] * result["pricing"]["cached_input_per_million_tokens"]
        + tokens["output"] * result["pricing"]["output_per_million_tokens"]
    ) / 1e6
    if not math.isclose(
        result["results"]["estimated_cost_usd"], expected_cost, abs_tol=1e-12
    ):
        raise ValueError("estimated cost does not match tokens and pricing")


def run_profiles(
    profiles: list[dict[str, Any]],
    artifact_root: Path,
    output_dir: Path,
    batch_id: str | None = None,
) -> None:
    _validate_profiles(profiles)
    artifact_root = _external_artifact_root(artifact_root)
    commit, dirty = _git_revision()
    if dirty:
        raise RuntimeError("OpenAI benchmark runs require a clean Git working tree")
    items = load_curated_items()
    total_items = len(items)
    batch_id = batch_id or datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    batch_dir = _artifact_batch_dir(artifact_root, batch_id)
    batch_dir.mkdir(parents=True, exist_ok=True)
    print(f"batch: {batch_id}", flush=True)
    pending_results: list[tuple[Path, dict[str, Any]]] = []

    for profile in profiles:
        started_at = datetime.now(UTC).isoformat()
        samples_path = batch_dir / f"{profile['name']}.samples.jsonl"
        manifest_path = batch_dir / f"{profile['name']}.manifest.json"
        fingerprint = hashlib.sha256(
            json.dumps(profile, sort_keys=True).encode()
        ).hexdigest()
        if manifest_path.is_file():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            if manifest["profile_fingerprint"] != fingerprint:
                raise RuntimeError(f"resume metadata mismatch for {profile['name']}")
            started_at = manifest["started_at"]
        else:
            manifest = {
                "profile": profile,
                "profile_fingerprint": fingerprint,
                "commit": commit,
                "started_at": started_at,
            }
            _write_json(manifest_path, manifest)
        completed = {sample["id"]: sample for sample in _load_jsonl(samples_path)}
        _refresh_completed_samples(completed, items)
        profile_complete = all(item.id in completed for item in items)
        profile_commit = _resumed_benchmark_commit(
            manifest["commit"], commit, profile_complete
        )
        remaining = [item for item in items if item.id not in completed]
        max_concurrency = profile["max_concurrency"]
        with ThreadPoolExecutor(max_workers=max_concurrency) as executor:
            for offset in range(0, len(remaining), max_concurrency):
                chunk = remaining[offset : offset + max_concurrency]
                futures = {
                    executor.submit(_run_sample, OpenAI(), profile, item): item
                    for item in chunk
                }
                failures = []
                for future in as_completed(futures):
                    item = futures[future]
                    try:
                        sample = future.result()
                    except Exception as error:
                        failures.append((item, error))
                        continue
                    sample["completed_at"] = datetime.now(UTC).isoformat()
                    _append_jsonl(samples_path, sample)
                    completed[item.id] = sample
                    print(
                        f"{profile['name']}: {len(completed)}/{total_items}",
                        flush=True,
                    )
                if failures:
                    item, error = failures[0]
                    raise RuntimeError(
                        f"OpenAI inference failed for {profile['name']} / {item.id}"
                    ) from error
        samples = [completed[item.id] for item in items]
        _rewrite_jsonl(samples_path, samples)
        completed_at = max(sample.get("completed_at", started_at) for sample in samples)
        result = _aggregate(
            profile=profile,
            samples=samples,
            started_at=started_at,
            completed_at=completed_at,
            commit=profile_commit,
            artifact_path=samples_path,
        )
        _write_json(batch_dir / f"{profile['name']}.result.json", result)
        pending_results.append((output_dir / profile["output"], result))

    for path, result in pending_results:
        _write_json(path, result)
        print(f"wrote {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--profiles", type=Path)
    source.add_argument("--validate", type=Path)
    parser.add_argument(
        "--artifact-root",
        type=Path,
        default=Path.home() / "scratch" / "alman-benchmark-runs" / "openai",
    )
    parser.add_argument(
        "--output-dir", type=Path, default=REPO_ROOT / "benchmark-results"
    )
    parser.add_argument("--batch-id")
    args = parser.parse_args()
    if args.validate:
        validate_openai_result(json.loads(args.validate.read_text(encoding="utf-8")))
        print(f"Valid OpenAI benchmark result: {args.validate}")
        return
    profiles = json.loads(args.profiles.read_text(encoding="utf-8"))
    run_profiles(profiles, args.artifact_root, args.output_dir, args.batch_id)


if __name__ == "__main__":
    main()
