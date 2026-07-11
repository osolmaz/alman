"""Safely run the Alman benchmark against a local Chat Completions endpoint."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import signal
import subprocess
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, model_validator

from alman.bench.dataset import load_curated_items
from alman.bench.results import build_result, write_result
from alman.bench.task import _system_prompt

REPO_ROOT = Path(__file__).resolve().parents[2]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ModelProfile(StrictModel):
    repository: str
    revision: str
    served_name: str
    quantization: str


class RecipeProfile(StrictModel):
    repository: str
    commit: str
    path: str
    profile: str
    deviations: list[str]


class RuntimeProfile(StrictModel):
    engine: str = "vllm"
    version: str
    executable: Path
    manifest: Path
    env: dict[str, str] = Field(default_factory=dict)
    serve_args: dict[str, Any]
    recipe: RecipeProfile


class EndpointProfile(StrictModel):
    host: str = "127.0.0.1"
    port: int
    api_key: str = "EMPTY"

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}/v1"


class GenerationProfile(StrictModel):
    max_tokens: int = Field(gt=0, le=16384)
    reasoning_token_budget: int = Field(gt=0, le=8192)
    sampling_source: str = "model_generation_config"
    do_sample: bool
    temperature: float = Field(ge=0)
    top_p: float = Field(gt=0, le=1)
    top_k: int = Field(gt=0)

    @model_validator(mode="after")
    def reserve_final_answer_tokens(self) -> GenerationProfile:
        if self.reasoning_token_budget >= self.max_tokens:
            raise ValueError("reasoning_token_budget must be less than max_tokens")
        return self


class SafetyProfile(StrictModel):
    guard: Path
    min_mem_available_gib: float = Field(ge=24)
    min_swap_free_gib: float = Field(ge=4)
    min_disk_free_gib: float = Field(ge=8)
    startup_timeout_seconds: int = Field(gt=0)
    request_timeout_seconds: int = Field(gt=0)


class HardwareProfile(StrictModel):
    accelerator: str
    unified_memory_gib: float = Field(gt=0)


class LocalBenchmarkProfile(StrictModel):
    name: str
    model: ModelProfile
    runtime: RuntimeProfile
    endpoint: EndpointProfile
    generation: GenerationProfile
    safety: SafetyProfile
    hardware: HardwareProfile


def _meminfo_gib(key: str) -> float:
    for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
        name, value, unit = line.split()
        if name == f"{key}:":
            if unit != "kB":
                raise ValueError(f"unexpected /proc/meminfo unit for {key}: {unit}")
            return int(value) / 1024 / 1024
    raise ValueError(f"missing {key} in /proc/meminfo")


def preflight(profile: LocalBenchmarkProfile) -> None:
    for label, path in [
        ("runtime executable", profile.runtime.executable),
        ("process guard", profile.safety.guard),
    ]:
        if not path.is_file() or not os.access(path, os.X_OK):
            raise ValueError(f"missing or non-executable {label}: {path}")
    if not profile.runtime.manifest.is_file():
        raise ValueError(f"missing runtime manifest: {profile.runtime.manifest}")
    earlyoom = subprocess.run(
        ["pgrep", "-x", "earlyoom"], capture_output=True, check=False
    )
    if earlyoom.returncode != 0:
        raise RuntimeError("earlyoom is not running")
    available = _meminfo_gib("MemAvailable")
    swap_free = _meminfo_gib("SwapFree")
    if available < profile.safety.min_mem_available_gib:
        raise RuntimeError(
            f"MemAvailable {available:.1f} GiB is below "
            f"{profile.safety.min_mem_available_gib:.1f} GiB"
        )
    if swap_free < profile.safety.min_swap_free_gib:
        raise RuntimeError(
            f"SwapFree {swap_free:.1f} GiB is below "
            f"{profile.safety.min_swap_free_gib:.1f} GiB"
        )
    disk_free = shutil.disk_usage(Path.home()).free / 1024**3
    if disk_free < profile.safety.min_disk_free_gib:
        raise RuntimeError(
            f"disk free {disk_free:.1f} GiB is below "
            f"{profile.safety.min_disk_free_gib:.1f} GiB"
        )
    processes = subprocess.run(
        ["ps", "-eo", "args="], capture_output=True, text=True, check=True
    ).stdout.splitlines()
    if any("vllm" in command and " serve " in command for command in processes):
        raise RuntimeError("another vLLM server is already running")


def _flag(name: str) -> str:
    return "--" + name.replace("_", "-")


def _serve_args(profile: LocalBenchmarkProfile) -> list[str]:
    args = [
        str(profile.runtime.executable),
        "serve",
        profile.model.repository,
        "--revision",
        profile.model.revision,
        "--served-model-name",
        profile.model.served_name,
        "--host",
        profile.endpoint.host,
        "--port",
        str(profile.endpoint.port),
        "--api-key",
        profile.endpoint.api_key,
    ]
    for name, value in profile.runtime.serve_args.items():
        if isinstance(value, bool):
            args.append(_flag(name) if value else _flag(f"no_{name}"))
        elif isinstance(value, (dict, list)):
            args.extend([_flag(name), json.dumps(value, separators=(",", ":"))])
        elif value is not None:
            args.extend([_flag(name), str(value)])
    return args


def guarded_command(profile: LocalBenchmarkProfile) -> list[str]:
    return [
        str(profile.safety.guard),
        "--label",
        profile.name,
        "--min-mem-gb",
        str(profile.safety.min_mem_available_gib),
        "--min-swap-gb",
        str(profile.safety.min_swap_free_gib),
        "--poll-sec",
        "1",
        "--",
        *_serve_args(profile),
    ]


def _wait_for_server(
    client: OpenAI, process: subprocess.Popen[str], timeout: int
) -> None:
    deadline = time.monotonic() + timeout
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(
                f"guarded server exited with status {process.returncode}"
            )
        try:
            client.models.list()
            return
        except Exception as error:  # endpoint is expected to refuse during startup
            last_error = error
            time.sleep(2)
    raise TimeoutError(f"server did not become ready: {last_error}")


def _smoke(client: OpenAI, profile: LocalBenchmarkProfile) -> dict[str, Any]:
    item = load_curated_items()[0]
    response = client.chat.completions.create(
        model=profile.model.served_name,
        messages=[
            {"role": "system", "content": _system_prompt(True)},
            {"role": "user", "content": item.source},
        ],
        max_tokens=profile.generation.max_tokens,
        extra_body={
            "chat_template_kwargs": {"enable_thinking": True},
            "thinking_token_budget": profile.generation.reasoning_token_budget,
        },
    )
    message = response.choices[0].message
    extras = message.model_extra or {}
    reasoning = extras.get("reasoning_content") or extras.get("reasoning")
    content = message.content or ""
    if not reasoning and "<think>" not in content:
        raise RuntimeError("thinking was enabled but no reasoning was observed")
    if not content.strip():
        raise RuntimeError("smoke response has no final answer")
    return response.model_dump()


def _inspect_command(
    profile: LocalBenchmarkProfile,
    log_dir: Path,
    run_id: str,
    generate_config: Path,
) -> list[str]:
    return [
        "uv",
        "run",
        "inspect",
        "eval",
        "alman/bench/task.py",
        "--model",
        f"openai-api/local/{profile.model.served_name}",
        "--model-base-url",
        profile.endpoint.base_url,
        "--max-connections",
        "1",
        "--max-samples",
        "1",
        "--max-tokens",
        str(profile.generation.max_tokens),
        "--generate-config",
        str(generate_config),
        "--timeout",
        str(profile.safety.request_timeout_seconds),
        "--log-dir",
        str(log_dir),
        "--display",
        "plain",
        "--metadata",
        f"local_run_id={run_id}",
        "--metadata",
        "thinking_enabled=true",
        "--metadata",
        f"reasoning_token_budget={profile.generation.reasoning_token_budget}",
    ]


def _metadata(
    profile: LocalBenchmarkProfile,
    run_id: str,
    server_args: list[str],
    artifact_dir: Path,
) -> dict[str, Any]:
    serve = profile.runtime.serve_args
    return {
        "run_id": run_id,
        "model": {
            **profile.model.model_dump(),
            "thinking": {
                "enabled": True,
                "verification_method": "nonempty reasoning_content or think block",
                "verified_sample_count": 0,
            },
        },
        "endpoint": {
            "provider": "inspect-openai-api",
            "api": "chat_completions",
            "base_url": profile.endpoint.base_url,
            "max_connections": 1,
            "max_samples": 1,
        },
        "runtime": {
            "engine": profile.runtime.engine,
            "version": profile.runtime.version,
            "executable": str(profile.runtime.executable),
            "manifest": str(profile.runtime.manifest),
            "recipe": profile.runtime.recipe.model_dump(),
            "server": {
                "arguments": server_args,
                "max_model_len": serve["max_model_len"],
                "max_num_seqs": serve["max_num_seqs"],
                "max_num_batched_tokens": serve["max_num_batched_tokens"],
                "kv_cache_dtype": serve["kv_cache_dtype"],
                "attention_backend": serve["attention_backend"],
                "moe_backend": serve["moe_backend"],
                "prefix_caching": serve["enable_prefix_caching"],
            },
        },
        "generation": profile.generation.model_dump(),
        "hardware": profile.hardware.model_dump(),
        "memory_guard": {
            "process_guard": str(profile.safety.guard),
            "earlyoom": True,
            "memory_available_floor_gib": profile.safety.min_mem_available_gib,
            "swap_free_floor_gib": profile.safety.min_swap_free_gib,
            "pressure_kill_occurred": False,
        },
        "artifacts": {
            "inspect_log": "",
            "server_log": str(artifact_dir / "server.log"),
            "smoke_response": str(artifact_dir / "smoke-response.json"),
        },
    }


def run(profile: LocalBenchmarkProfile, output: Path, artifact_root: Path) -> None:
    preflight(profile)
    run_id = f"{datetime.now(UTC).strftime('%Y%m%dT%H%M%SZ')}-{profile.name}"
    artifact_dir = artifact_root / run_id
    log_dir = artifact_dir / "inspect"
    artifact_dir.mkdir(parents=True, exist_ok=False)
    log_dir.mkdir()
    server_log_path = artifact_dir / "server.log"
    server_args = _serve_args(profile)
    command = guarded_command(profile)
    generate_config_path = artifact_dir / "generate-config.json"
    generate_config_path.write_text(
        json.dumps(
            {
                "extra_body": {
                    "chat_template_kwargs": {"enable_thinking": True},
                    "thinking_token_budget": profile.generation.reasoning_token_budget,
                }
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    env = os.environ | profile.runtime.env
    guard_process: subprocess.Popen[str] | None = None

    try:
        with server_log_path.open("w", encoding="utf-8") as server_log:
            guard_process = subprocess.Popen(
                command,
                cwd=REPO_ROOT,
                env=env,
                stdout=server_log,
                stderr=subprocess.STDOUT,
                text=True,
            )
        client = OpenAI(
            base_url=profile.endpoint.base_url,
            api_key=profile.endpoint.api_key,
            timeout=profile.safety.request_timeout_seconds,
        )
        _wait_for_server(client, guard_process, profile.safety.startup_timeout_seconds)
        smoke = _smoke(client, profile)
        (artifact_dir / "smoke-response.json").write_text(
            json.dumps(smoke, indent=2) + "\n", encoding="utf-8"
        )

        inspect_env = env | {
            "LOCAL_API_KEY": profile.endpoint.api_key,
            "LOCAL_BASE_URL": profile.endpoint.base_url,
        }
        subprocess.run(
            _inspect_command(profile, log_dir, run_id, generate_config_path),
            cwd=REPO_ROOT,
            env=inspect_env,
            check=True,
        )
        logs = list(log_dir.glob("*.eval"))
        if len(logs) != 1:
            raise RuntimeError(f"expected one Inspect log, found {len(logs)}")
        metadata = _metadata(profile, run_id, server_args, artifact_dir)
        metadata["artifacts"]["inspect_log"] = str(logs[0])
        result = build_result(logs[0], metadata)
        write_result(result, output)
    finally:
        if guard_process is not None and guard_process.poll() is None:
            guard_process.send_signal(signal.SIGTERM)
            try:
                guard_process.wait(timeout=30)
            except subprocess.TimeoutExpired:
                guard_process.kill()
                guard_process.wait(timeout=10)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--artifact-root",
        type=Path,
        default=Path.home() / "scratch" / "alman-benchmark-runs",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    profile = LocalBenchmarkProfile.model_validate_json(
        args.profile.read_text(encoding="utf-8")
    )
    if args.dry_run:
        preflight(profile)
        print(
            json.dumps(
                {
                    "serve": guarded_command(profile),
                    "inspect": _inspect_command(
                        profile,
                        Path("<log-dir>"),
                        "<run-id>",
                        Path("<artifact-dir>/generate-config.json"),
                    ),
                },
                indent=2,
            )
        )
        return
    run(profile, args.output, args.artifact_root)


if __name__ == "__main__":
    main()
