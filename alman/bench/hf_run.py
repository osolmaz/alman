"""Run the curated Alman benchmark through Hugging Face Inference Providers."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import time
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from huggingface_hub import InferenceClient
from jsonschema import Draft202012Validator, FormatChecker

from alman.bench.dataset import load_curated_items
from alman.bench.scoring import is_accepted, lint
from alman.bench.task import _system_prompt

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "benchmark-results" / "hosted-result.schema.json"
PLATFORM = "huggingface-inference-providers"
THINKING_MAX_TOKENS = 4096
FORCED_FINAL_MAX_TOKENS = 512
PROFILE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "name",
        "model",
        "hub_revision",
        "provider",
        "provider_model_id",
        "thinking_control",
        "thinking_extra_body",
        "forced_final_extra_body",
        "forced_final_disables_thinking",
        "temperature",
        "top_p",
        "input_price_per_million",
        "output_price_per_million",
        "pricing_observed_at",
        "output",
    ],
    "properties": {
        "name": {"type": "string", "pattern": "^[a-z0-9][a-z0-9._-]+$"},
        "model": {
            "enum": [
                "deepseek-ai/DeepSeek-V4-Pro",
                "deepseek-ai/DeepSeek-V4-Flash",
                "zai-org/GLM-5.2",
                "moonshotai/Kimi-K2.7-Code",
            ]
        },
        "hub_revision": {"type": "string", "pattern": "^[0-9a-f]{40}$"},
        "provider": {"const": "novita"},
        "provider_model_id": {"type": "string", "minLength": 1},
        "thinking_control": {"type": "string", "minLength": 1},
        "thinking_extra_body": {"type": "object"},
        "forced_final_extra_body": {"type": "object"},
        "forced_final_disables_thinking": {"type": "boolean"},
        "forced_final_max_tokens": {
            "type": "integer",
            "minimum": 512,
            "maximum": 2048,
        },
        "temperature": {"const": 1.0},
        "top_p": {"enum": [0.95, 1.0]},
        "input_price_per_million": {"type": "number", "minimum": 0},
        "output_price_per_million": {"type": "number", "minimum": 0},
        "pricing_observed_at": {"type": "string", "format": "date-time"},
        "output": {"type": "string", "pattern": "^[^/]+\\.json$"},
    },
}


def _score(correct: int, total: int) -> dict[str, int | float]:
    rate = correct / total
    return {
        "correct": correct,
        "total": total,
        "rate": rate,
        "stderr": math.sqrt(rate * (1 - rate) / total),
    }


def _git_revision() -> tuple[str, bool]:
    commit = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    status = subprocess.run(
        ["git", "status", "--porcelain=v1"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    return commit, bool(status)


def _response_data(response: Any) -> dict[str, Any]:
    choice = response.choices[0]
    message = choice.message
    data = message.model_dump() if hasattr(message, "model_dump") else vars(message)
    usage = (
        response.usage.model_dump()
        if response.usage is not None and hasattr(response.usage, "model_dump")
        else vars(response.usage)
        if response.usage is not None
        else {}
    )
    details = usage.get("completion_tokens_details") or {}
    return {
        "response_id": getattr(response, "id", None),
        "returned_model": getattr(response, "model", None),
        "finish_reason": choice.finish_reason,
        "content": (data.get("content") or "").strip(),
        "reasoning": (
            data.get("reasoning_content") or data.get("reasoning") or ""
        ).strip(),
        "tokens": {
            "input": usage.get("prompt_tokens", 0),
            "output": usage.get("completion_tokens", 0),
            "reasoning": details.get("reasoning_tokens"),
            "total": usage.get("total_tokens", 0),
        },
    }


def _request(
    client: InferenceClient,
    *,
    model: str,
    messages: list[dict[str, str]],
    extra_body: dict[str, Any],
    max_tokens: int,
    temperature: float,
    top_p: float,
    retries: int = 2,
) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                extra_body=extra_body,
            )
            return _response_data(response)
        except Exception as error:
            last_error = error
            if attempt == retries:
                break
            time.sleep(2**attempt)
    raise RuntimeError(f"hosted inference failed after {retries + 1} attempts") from last_error


def _run_sample(client: InferenceClient, profile: dict[str, Any], item: Any) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": _system_prompt(True)},
        {"role": "user", "content": item.source},
    ]
    primary = _request(
        client,
        model=profile["model"],
        messages=messages,
        extra_body=profile["thinking_extra_body"],
        max_tokens=THINKING_MAX_TOKENS,
        temperature=profile["temperature"],
        top_p=profile["top_p"],
    )
    forced_final = not bool(primary["content"])
    fallback = None
    output = primary["content"]
    if forced_final:
        fallback_messages = [
            *messages,
            {
                "role": "assistant",
                "content": "",
                "reasoning_content": primary["reasoning"],
            },
            {
                "role": "user",
                "content": (
                    "The reasoning budget is exhausted. Do not restart the analysis. "
                    "Return only the final Alman translation now."
                ),
            },
        ]
        fallback = _request(
            client,
            model=profile["model"],
            messages=fallback_messages,
            extra_body=profile["forced_final_extra_body"],
            max_tokens=profile.get(
                "forced_final_max_tokens", FORCED_FINAL_MAX_TOKENS
            ),
            temperature=profile["temperature"],
            top_p=profile["top_p"],
        )
        output = fallback["content"]
        if not output:
            raise RuntimeError(f"forced-final request returned no answer for {item.id}")

    tokens = primary["tokens"].copy()
    if fallback is not None:
        for field in ("input", "output", "total"):
            tokens[field] += fallback["tokens"][field]
        reasoning_values = [
            value
            for value in (
                primary["tokens"]["reasoning"],
                fallback["tokens"]["reasoning"],
            )
            if value is not None
        ]
        tokens["reasoning"] = sum(reasoning_values) if reasoning_values else None

    return {
        "id": item.id,
        "source": item.source,
        "accepted": item.accepted,
        "paragraph": item.paragraph,
        "output": output,
        "reasoning": primary["reasoning"],
        "thinking_observed": bool(primary["reasoning"]),
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


def _append_jsonl(path: Path, value: dict[str, Any]) -> None:
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(value, ensure_ascii=False) + "\n")
        handle.flush()


def _write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    lines = [
        line
        for line in text.splitlines()
        if line.strip()
    ]
    values = []
    for index, line in enumerate(lines):
        try:
            values.append(json.loads(line))
        except json.JSONDecodeError:
            if index != len(lines) - 1 or text.endswith(("\n", "\r")):
                raise
            repaired = "\n".join(lines[:index])
            if repaired:
                repaired += "\n"
            repair_path = path.with_suffix(path.suffix + ".repair")
            repair_path.write_text(repaired, encoding="utf-8")
            repair_path.replace(path)
            return values
    if text and not text.endswith(("\n", "\r")):
        with path.open("a", encoding="utf-8") as handle:
            handle.write("\n")
    return values


def _validate_profiles(profiles: list[dict[str, Any]]) -> None:
    validator = Draft202012Validator(
        PROFILE_SCHEMA,
        format_checker=FormatChecker(),
    )
    for profile in profiles:
        validator.validate(profile)
    for field in ("name", "output"):
        values = [profile[field] for profile in profiles]
        if len(values) != len(set(values)):
            raise ValueError(f"hosted profile {field} values must be unique")


def _external_artifact_root(path: Path) -> Path:
    resolved = path.expanduser().resolve()
    if resolved == REPO_ROOT or REPO_ROOT in resolved.parents:
        raise ValueError("artifact root must be outside the Git working tree")
    return resolved


def _artifact_batch_dir(artifact_root: Path, batch_id: str) -> Path:
    if Path(batch_id).name != batch_id or batch_id in {".", ".."}:
        raise ValueError("batch id must be a single path component")
    resolved = (artifact_root / batch_id).resolve()
    if artifact_root not in resolved.parents:
        raise ValueError("batch directory must remain under the artifact root")
    return resolved


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
    token_totals: dict[str, int | None] = {}
    for field in ("input", "output", "reasoning", "total"):
        values = [sample["tokens"][field] for sample in samples]
        present = [value for value in values if value is not None]
        token_totals[field] = sum(present) if present else None
    input_cost = token_totals["input"] * profile["input_price_per_million"] / 1e6
    output_cost = token_totals["output"] * profile["output_price_per_million"] / 1e6
    result = {
        "$schema": "./hosted-result.schema.json",
        "schema_version": 1,
        "run": {
            "id": f"{started_at.replace('-', '').replace(':', '')[:15]}Z-{profile['name']}",
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
            "repository": profile["model"],
            "hub_revision": profile["hub_revision"],
            "provider_model_id": profile["provider_model_id"],
            "served_revision_pinned": False,
            "thinking": {
                "enabled": True,
                "mode": "think",
                "provider_control": profile["thinking_control"],
                "thinking_call_max_tokens": THINKING_MAX_TOKENS,
                "samples_with_reasoning": sum(
                    sample["thinking_observed"] for sample in samples
                ),
                "max_thinking_call_completion_tokens": max(
                    sample.get(
                        "primary_completion_tokens",
                        min(sample["tokens"]["output"], THINKING_MAX_TOKENS),
                    )
                    for sample in samples
                ),
                "max_reported_reasoning_tokens": max(
                    (
                        sample.get(
                            "primary_reasoning_tokens", sample["tokens"]["reasoning"]
                        )
                        or 0
                    )
                    for sample in samples
                )
                or None,
                "forced_final_fallback_count": sum(
                    sample["forced_final"] for sample in samples
                ),
                "forced_final_fallback_disables_thinking": profile[
                    "forced_final_disables_thinking"
                ],
            },
        },
        "endpoint": {
            "platform": PLATFORM,
            "provider": profile["provider"],
            "api": "chat_completions",
            "routing": "explicit-client-provider",
        },
        "generation": {
            "temperature": profile["temperature"],
            "top_p": profile["top_p"],
            "thinking_call_max_tokens": THINKING_MAX_TOKENS,
            "forced_final_max_tokens": profile.get(
                "forced_final_max_tokens", FORCED_FINAL_MAX_TOKENS
            ),
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
            "estimated_cost_usd": input_cost + output_cost,
        },
        "pricing": {
            "currency": "USD",
            "input_per_million_tokens": profile["input_price_per_million"],
            "output_per_million_tokens": profile["output_price_per_million"],
            "observed_at": profile["pricing_observed_at"],
        },
        "artifacts": {"samples_jsonl": str(artifact_path)},
    }
    validate_hosted_result(result)
    return result


def validate_hosted_result(result: dict[str, Any]) -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(result)
    sample_count = result["benchmark"]["sample_count"]
    for score in [
        result["results"]["acceptance"],
        result["results"]["compliance"],
        *result["results"]["groups"].values(),
    ]:
        expected = score["correct"] / score["total"]
        if not math.isclose(score["rate"], expected, abs_tol=1e-12):
            raise ValueError("score rate does not match its counts")
        expected_stderr = math.sqrt(expected * (1 - expected) / score["total"])
        if not math.isclose(score["stderr"], expected_stderr, abs_tol=1e-12):
            raise ValueError("score stderr does not match its counts")
    acceptance = result["results"]["acceptance"]
    compliance = result["results"]["compliance"]
    groups = result["results"]["groups"].values()
    if acceptance["total"] != sample_count or compliance["total"] != sample_count:
        raise ValueError("headline score totals must match the sample count")
    if sum(group["total"] for group in groups) != sample_count:
        raise ValueError("group totals must match the sample count")
    if sum(group["correct"] for group in result["results"]["groups"].values()) != acceptance["correct"]:
        raise ValueError("group correct counts must match headline acceptance")
    if result["model"]["thinking"]["samples_with_reasoning"] < 1:
        raise ValueError("thinking must be observed")
    if (
        result["model"]["thinking"]["max_thinking_call_completion_tokens"]
        > THINKING_MAX_TOKENS
    ):
        raise ValueError("thinking call exceeds its completion-token cap")
    reported_reasoning = result["model"]["thinking"]["max_reported_reasoning_tokens"]
    if reported_reasoning is not None and reported_reasoning > THINKING_MAX_TOKENS:
        raise ValueError("reported reasoning exceeds the thinking-call token cap")


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
        raise RuntimeError("hosted benchmark runs require a clean Git working tree")
    items = load_curated_items()
    if len(items) != 48:
        raise RuntimeError(f"expected 48 curated items, found {len(items)}")
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
            if manifest["profile_fingerprint"] != fingerprint or manifest["commit"] != commit:
                raise RuntimeError(f"resume metadata mismatch for {profile['name']}")
            started_at = manifest["started_at"]
        else:
            manifest_path.write_text(
                json.dumps(
                    {
                        "profile": profile,
                        "profile_fingerprint": fingerprint,
                        "commit": commit,
                        "started_at": started_at,
                    },
                    indent=2,
                )
                + "\n",
                encoding="utf-8",
            )
        completed = {sample["id"]: sample for sample in _load_jsonl(samples_path)}
        client = InferenceClient(provider=profile["provider"], timeout=600)
        for index, item in enumerate(items, start=1):
            if item.id in completed:
                continue
            sample = _run_sample(client, profile, item)
            sample["completed_at"] = datetime.now(UTC).isoformat()
            _append_jsonl(samples_path, sample)
            completed[item.id] = sample
            print(f"{profile['name']}: {index}/48", flush=True)
        samples = [completed[item.id] for item in items]
        completed_at = datetime.now(UTC).isoformat()
        result = _aggregate(
            profile=profile,
            samples=samples,
            started_at=started_at,
            completed_at=completed_at,
            commit=commit,
            artifact_path=samples_path,
        )
        checkpoint_path = batch_dir / f"{profile['name']}.result.json"
        _write_json(checkpoint_path, result)
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
        default=Path.home() / "scratch" / "alman-benchmark-runs" / "hf-providers",
    )
    parser.add_argument(
        "--output-dir", type=Path, default=REPO_ROOT / "benchmark-results"
    )
    parser.add_argument("--batch-id")
    args = parser.parse_args()
    if args.validate:
        validate_hosted_result(json.loads(args.validate.read_text(encoding="utf-8")))
        print(f"Valid hosted benchmark result: {args.validate}")
        return
    profiles = json.loads(args.profiles.read_text(encoding="utf-8"))
    run_profiles(profiles, args.artifact_root, args.output_dir, args.batch_id)


if __name__ == "__main__":
    main()
