"""Run the curated Alman benchmark through Anthropic's Messages API."""

from __future__ import annotations

import argparse
import json
import math
import os
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from jsonschema import Draft202012Validator, FormatChecker

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
SCHEMA_PATH = REPO_ROOT / "benchmark-results" / "anthropic-result.schema.json"
API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
MODEL = "claude-sonnet-5"
MODEL_LABEL = "Claude Sonnet 5"
THINKING_MAX_TOKENS = 4096
FORCED_FINAL_MAX_TOKENS = 512
MAX_RETRIES = 2
PRICING = {
    "input": 2.0,
    "cache_write_5m": 2.5,
    "cache_write_1h": 4.0,
    "cache_read": 0.2,
    "output": 10.0,
}
TOKEN_FIELDS = (
    "input",
    "cache_read_input",
    "cache_creation_input",
    "cache_creation_5m_input",
    "cache_creation_1h_input",
    "output",
    "reasoning",
    "total",
)
PROFILE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "name",
        "model",
        "label",
        "reasoning_effort",
        "forced_final_effort",
        "cache_ttl",
        "max_concurrency",
        "input_price_per_million",
        "cache_write_5m_price_per_million",
        "cache_write_1h_price_per_million",
        "cache_read_price_per_million",
        "output_price_per_million",
        "pricing_observed_at",
        "introductory_pricing_ends",
        "output",
    ],
    "properties": {
        "name": {"type": "string", "pattern": "^[a-z0-9][a-z0-9._-]+$"},
        "model": {"const": MODEL},
        "label": {"const": MODEL_LABEL},
        "reasoning_effort": {"const": "xhigh"},
        "forced_final_effort": {"const": "low"},
        "cache_ttl": {"const": "1h"},
        "max_concurrency": {"type": "integer", "minimum": 1, "maximum": 8},
        "input_price_per_million": {"const": PRICING["input"]},
        "cache_write_5m_price_per_million": {
            "const": PRICING["cache_write_5m"]
        },
        "cache_write_1h_price_per_million": {
            "const": PRICING["cache_write_1h"]
        },
        "cache_read_price_per_million": {"const": PRICING["cache_read"]},
        "output_price_per_million": {"const": PRICING["output"]},
        "pricing_observed_at": {"type": "string", "format": "date-time"},
        "introductory_pricing_ends": {"const": "2026-08-31"},
        "output": {"type": "string", "pattern": "^[^/]+\\.json$"},
    },
}


def _validate_profile(profile: dict[str, Any]) -> None:
    Draft202012Validator(
        PROFILE_SCHEMA, format_checker=FormatChecker()
    ).validate(profile)


def _system_blocks(cache_ttl: str) -> list[dict[str, Any]]:
    return [
        {
            "type": "text",
            "text": _system_prompt(True),
            "cache_control": {"type": "ephemeral", "ttl": cache_ttl},
        }
    ]


def _response_data(response: dict[str, Any]) -> dict[str, Any]:
    usage = response["usage"]
    cache_creation = usage.get("cache_creation") or {}
    output_details = usage.get("output_tokens_details") or {}
    tokens = {
        "input": usage.get("input_tokens", 0),
        "cache_read_input": usage.get("cache_read_input_tokens", 0),
        "cache_creation_input": usage.get("cache_creation_input_tokens", 0),
        "cache_creation_5m_input": cache_creation.get(
            "ephemeral_5m_input_tokens", 0
        ),
        "cache_creation_1h_input": cache_creation.get(
            "ephemeral_1h_input_tokens", 0
        ),
        "output": usage.get("output_tokens", 0),
        "reasoning": output_details.get("thinking_tokens", 0),
        "total": 0,
    }
    tokens["total"] = (
        tokens["input"]
        + tokens["cache_read_input"]
        + tokens["cache_creation_input"]
        + tokens["output"]
    )
    text = "".join(
        block.get("text", "")
        for block in response.get("content", [])
        if block.get("type") == "text"
    ).strip()
    return {
        "response_id": response["id"],
        "returned_model": response["model"],
        "stop_reason": response.get("stop_reason"),
        "content": text,
        "tokens": tokens,
    }


def _request(
    client: httpx.Client,
    *,
    model: str,
    system: list[dict[str, Any]],
    messages: list[dict[str, Any]],
    max_tokens: int,
    thinking: dict[str, str],
    effort: str,
    retries: int = MAX_RETRIES,
) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            response = client.post(
                API_URL,
                json={
                    "model": model,
                    "max_tokens": max_tokens,
                    "thinking": thinking,
                    "output_config": {"effort": effort},
                    "system": system,
                    "messages": messages,
                },
            )
            response.raise_for_status()
            return _response_data(response.json())
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as error:
            last_error = error
            if attempt == retries:
                break
            time.sleep(2**attempt)
    raise RuntimeError(
        f"Anthropic inference failed after {retries + 1} attempts"
    ) from last_error


def _prewarm(
    client: httpx.Client, profile: dict[str, Any]
) -> dict[str, Any]:
    response = _request(
        client,
        model=profile["model"],
        system=_system_blocks(profile["cache_ttl"]),
        messages=[{"role": "user", "content": "Acknowledge with one character."}],
        max_tokens=1,
        thinking={"type": "adaptive", "display": "omitted"},
        effort=profile["reasoning_effort"],
    )
    tokens = response["tokens"]
    if not (tokens["cache_creation_input"] or tokens["cache_read_input"]):
        raise RuntimeError("Anthropic did not create or read the specification cache")
    return response


def _run_sample(
    client: httpx.Client, profile: dict[str, Any], item: Any
) -> dict[str, Any]:
    system = _system_blocks(profile["cache_ttl"])
    messages = [{"role": "user", "content": item.source}]
    primary = _request(
        client,
        model=profile["model"],
        system=system,
        messages=messages,
        max_tokens=THINKING_MAX_TOKENS,
        thinking={"type": "adaptive", "display": "omitted"},
        effort=profile["reasoning_effort"],
    )
    if not primary["tokens"]["cache_read_input"]:
        raise RuntimeError(f"specification cache miss for {item.id}")

    forced_final = not bool(primary["content"])
    fallback = None
    output = primary["content"]
    if forced_final:
        fallback = _request(
            client,
            model=profile["model"],
            system=system,
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
            max_tokens=FORCED_FINAL_MAX_TOKENS,
            thinking={"type": "disabled"},
            effort=profile["forced_final_effort"],
        )
        if fallback["tokens"]["reasoning"]:
            raise RuntimeError(
                f"forced-final request used reasoning tokens for {item.id}"
            )
        if not fallback["tokens"]["cache_read_input"]:
            raise RuntimeError(f"forced-final specification cache miss for {item.id}")
        output = fallback["content"]
        if not output:
            raise RuntimeError(f"forced-final request returned no answer for {item.id}")

    tokens = primary["tokens"].copy()
    if fallback is not None:
        for field in TOKEN_FIELDS:
            tokens[field] += fallback["tokens"][field]

    return {
        "id": item.id,
        "source": item.source,
        "accepted": item.accepted,
        "paragraph": item.paragraph,
        "output": output,
        "thinking_observed": primary["tokens"]["reasoning"] > 0,
        "forced_final": forced_final,
        "cache_hit": primary["tokens"]["cache_read_input"] > 0,
        "correct": is_accepted(output, item.accepted),
        "compliant": not lint(output),
        "tokens": tokens,
        "primary_output_tokens": primary["tokens"]["output"],
        "primary_reasoning_tokens": primary["tokens"]["reasoning"],
        "primary": {
            key: primary[key]
            for key in ("response_id", "returned_model", "stop_reason")
        },
        "fallback": (
            {
                key: fallback[key]
                for key in ("response_id", "returned_model", "stop_reason")
            }
            if fallback is not None
            else None
        ),
    }


def _token_cost(tokens: dict[str, int], profile: dict[str, Any]) -> float:
    return (
        tokens["input"] * profile["input_price_per_million"]
        + tokens["cache_creation_5m_input"]
        * profile["cache_write_5m_price_per_million"]
        + tokens["cache_creation_1h_input"]
        * profile["cache_write_1h_price_per_million"]
        + tokens["cache_read_input"] * profile["cache_read_price_per_million"]
        + tokens["output"] * profile["output_price_per_million"]
    ) / 1e6


def _aggregate(
    *,
    profile: dict[str, Any],
    samples: list[dict[str, Any]],
    prewarm: dict[str, Any],
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
        for field in TOKEN_FIELDS
    }
    prewarm_cost = _token_cost(prewarm["tokens"], profile)
    sample_cost = _token_cost(token_totals, profile)
    cache_hit_count = sum(sample["cache_hit"] for sample in samples)
    returned_models = {
        prewarm["returned_model"],
        *(sample["primary"]["returned_model"] for sample in samples),
        *(
            sample["fallback"]["returned_model"]
            for sample in samples
            if sample["fallback"] is not None
        ),
    }
    result = {
        "$schema": "./anthropic-result.schema.json",
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
            "returned_models": sorted(returned_models),
            "snapshot_pinned": True,
            "reasoning": {
                "enabled": True,
                "type": "adaptive",
                "effort": profile["reasoning_effort"],
                "display": "omitted",
                "primary_call_max_output_tokens": THINKING_MAX_TOKENS,
                "samples_with_reasoning": sum(
                    sample["thinking_observed"] for sample in samples
                ),
                "max_primary_output_tokens": max(
                    sample["primary_output_tokens"] for sample in samples
                ),
                "max_primary_reasoning_tokens": max(
                    sample["primary_reasoning_tokens"] for sample in samples
                ),
                "forced_final_fallback_count": sum(
                    sample["forced_final"] for sample in samples
                ),
                "forced_final_thinking_disabled": True,
                "forced_final_effort": profile["forced_final_effort"],
            },
        },
        "endpoint": {
            "platform": "anthropic-api",
            "provider": "anthropic",
            "api": "messages",
            "anthropic_version": ANTHROPIC_VERSION,
            "max_concurrency": profile["max_concurrency"],
        },
        "cache": {
            "enabled": True,
            "type": "explicit",
            "scope": "system",
            "ttl": profile["cache_ttl"],
            "prewarm": {
                "response_id": prewarm["response_id"],
                "returned_model": prewarm["returned_model"],
                "tokens": prewarm["tokens"],
                "estimated_cost_usd": prewarm_cost,
            },
            "sample_cache_hit_count": cache_hit_count,
            "sample_cache_hit_rate": cache_hit_count / len(samples),
        },
        "generation": {
            "primary_max_output_tokens": THINKING_MAX_TOKENS,
            "forced_final_max_output_tokens": FORCED_FINAL_MAX_TOKENS,
            "max_retries": MAX_RETRIES,
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
            "estimated_cost_usd": sample_cost + prewarm_cost,
        },
        "pricing": {
            "currency": "USD",
            "input_per_million_tokens": profile["input_price_per_million"],
            "cache_write_5m_per_million_tokens": profile[
                "cache_write_5m_price_per_million"
            ],
            "cache_write_1h_per_million_tokens": profile[
                "cache_write_1h_price_per_million"
            ],
            "cache_read_per_million_tokens": profile[
                "cache_read_price_per_million"
            ],
            "output_per_million_tokens": profile["output_price_per_million"],
            "observed_at": profile["pricing_observed_at"],
            "introductory_pricing_ends": profile["introductory_pricing_ends"],
        },
        "artifacts": {"samples_jsonl": str(artifact_path)},
    }
    validate_anthropic_result(result)
    return result


def _validate_tokens(tokens: dict[str, int]) -> None:
    if tokens["cache_creation_input"] != (
        tokens["cache_creation_5m_input"] + tokens["cache_creation_1h_input"]
    ):
        raise ValueError("cache creation token details do not match their total")
    if tokens["reasoning"] > tokens["output"]:
        raise ValueError("reasoning tokens cannot exceed total output")
    expected_total = (
        tokens["input"]
        + tokens["cache_read_input"]
        + tokens["cache_creation_input"]
        + tokens["output"]
    )
    if tokens["total"] != expected_total:
        raise ValueError("token categories do not sum to total tokens")


def validate_anthropic_result(result: dict[str, Any]) -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(result)
    sample_count = result["benchmark"]["sample_count"]
    scores = [
        result["results"]["acceptance"],
        result["results"]["compliance"],
        *result["results"]["groups"].values(),
    ]
    for score in scores:
        rate = score["correct"] / score["total"]
        if not math.isclose(score["rate"], rate, abs_tol=1e-12):
            raise ValueError("score rate does not match its counts")
        stderr = math.sqrt(rate * (1 - rate) / score["total"])
        if not math.isclose(score["stderr"], stderr, abs_tol=1e-12):
            raise ValueError("score stderr does not match its counts")
    if any(score["total"] != sample_count for score in scores[:2]):
        raise ValueError("headline score totals must match the sample count")
    if sum(
        score["total"] for score in result["results"]["groups"].values()
    ) != sample_count:
        raise ValueError("group totals must match the sample count")
    if sum(
        score["correct"] for score in result["results"]["groups"].values()
    ) != result["results"]["acceptance"]["correct"]:
        raise ValueError("group correct counts must match headline acceptance")

    sample_tokens = result["results"]["tokens"]
    prewarm_tokens = result["cache"]["prewarm"]["tokens"]
    _validate_tokens(sample_tokens)
    _validate_tokens(prewarm_tokens)
    pricing = result["pricing"]
    profile = {
        "input_price_per_million": pricing["input_per_million_tokens"],
        "cache_write_5m_price_per_million": pricing[
            "cache_write_5m_per_million_tokens"
        ],
        "cache_write_1h_price_per_million": pricing[
            "cache_write_1h_per_million_tokens"
        ],
        "cache_read_price_per_million": pricing[
            "cache_read_per_million_tokens"
        ],
        "output_price_per_million": pricing["output_per_million_tokens"],
    }
    expected_prewarm_cost = _token_cost(prewarm_tokens, profile)
    if not math.isclose(
        result["cache"]["prewarm"]["estimated_cost_usd"],
        expected_prewarm_cost,
        abs_tol=1e-12,
    ):
        raise ValueError("prewarm cost does not match tokens and pricing")
    expected_cost = _token_cost(sample_tokens, profile) + expected_prewarm_cost
    if not math.isclose(
        result["results"]["estimated_cost_usd"], expected_cost, abs_tol=1e-12
    ):
        raise ValueError("estimated cost does not match tokens and pricing")


def run_profile(
    profile: dict[str, Any],
    artifact_root: Path,
    output_dir: Path,
    batch_id: str | None = None,
) -> None:
    _validate_profile(profile)
    artifact_root = _external_artifact_root(artifact_root)
    commit, dirty = _git_revision()
    if dirty:
        raise RuntimeError("Anthropic benchmark runs require a clean Git working tree")
    items = load_curated_items()
    total_items = len(items)
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")

    batch_id = batch_id or datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    batch_dir = _artifact_batch_dir(artifact_root, batch_id)
    batch_dir.mkdir(parents=True, exist_ok=True)
    samples_path = batch_dir / f"{profile['name']}.samples.jsonl"
    manifest_path = batch_dir / f"{profile['name']}.manifest.json"
    started_at = datetime.now(UTC).isoformat()
    print(f"batch: {batch_id}", flush=True)

    headers = {
        "x-api-key": api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }
    with httpx.Client(headers=headers, timeout=600.0) as client:
        if manifest_path.is_file():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            if manifest["profile"] != profile:
                raise RuntimeError(f"resume metadata mismatch for {profile['name']}")
            started_at = manifest["started_at"]
            prewarm = manifest["prewarm"]
        else:
            prewarm = _prewarm(client, profile)
            manifest = {
                "profile": profile,
                "commit": commit,
                "started_at": started_at,
                "prewarm": prewarm,
            }
            _write_json(manifest_path, manifest)
            print(
                "cache prewarmed: "
                f"created={prewarm['tokens']['cache_creation_input']} "
                f"read={prewarm['tokens']['cache_read_input']}",
                flush=True,
            )

        completed = {sample["id"]: sample for sample in _load_jsonl(samples_path)}
        _refresh_completed_samples(completed, items)
        profile_complete = all(item.id in completed for item in items)
        profile_commit = _resumed_benchmark_commit(
            manifest["commit"], commit, profile_complete
        )
        remaining = [item for item in items if item.id not in completed]
        max_concurrency = profile["max_concurrency"]
        if not completed and remaining:
            first_item = remaining.pop(0)
            try:
                first_sample = _run_sample(client, profile, first_item)
            except Exception as error:
                raise RuntimeError(
                    "Anthropic cache verification failed for "
                    f"{profile['name']} / {first_item.id}"
                ) from error
            first_sample["completed_at"] = datetime.now(UTC).isoformat()
            _append_jsonl(samples_path, first_sample)
            completed[first_item.id] = first_sample
            print(
                f"cache verified; {profile['name']}: {len(completed)}/{total_items}",
                flush=True,
            )
        with ThreadPoolExecutor(max_workers=max_concurrency) as executor:
            for offset in range(0, len(remaining), max_concurrency):
                chunk = remaining[offset : offset + max_concurrency]
                futures = {
                    executor.submit(_run_sample, client, profile, item): item
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
                        f"Anthropic inference failed for {profile['name']} / {item.id}"
                    ) from error

    samples = [completed[item.id] for item in items]
    _rewrite_jsonl(samples_path, samples)
    completed_at = max(sample["completed_at"] for sample in samples)
    result = _aggregate(
        profile=profile,
        samples=samples,
        prewarm=prewarm,
        started_at=started_at,
        completed_at=completed_at,
        commit=profile_commit,
        artifact_path=samples_path,
    )
    _write_json(batch_dir / f"{profile['name']}.result.json", result)
    output_path = output_dir / profile["output"]
    _write_json(output_path, result)
    print(f"wrote {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--profile", type=Path)
    source.add_argument("--validate", type=Path)
    parser.add_argument(
        "--artifact-root",
        type=Path,
        default=Path.home() / "scratch" / "alman-benchmark-runs" / "anthropic",
    )
    parser.add_argument(
        "--output-dir", type=Path, default=REPO_ROOT / "benchmark-results"
    )
    parser.add_argument("--batch-id")
    args = parser.parse_args()
    if args.validate:
        validate_anthropic_result(
            json.loads(args.validate.read_text(encoding="utf-8"))
        )
        print(f"Valid Anthropic benchmark result: {args.validate}")
        return
    profile = json.loads(args.profile.read_text(encoding="utf-8"))
    run_profile(profile, args.artifact_root, args.output_dir, args.batch_id)


if __name__ == "__main__":
    main()
