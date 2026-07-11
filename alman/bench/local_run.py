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
from typing import Any, Literal

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field, model_validator

from alman.bench.dataset import load_curated_items
from alman.bench.results import build_result, raw_thinking_parts, write_result
from alman.bench.task import _system_prompt

REPO_ROOT = Path(__file__).resolve().parents[2]


def _is_credential_flag(flag: str) -> bool:
    return flag in {"--api-key", "--hf-token"} or flag.endswith(
        ("-api-key", "-access-token", "-auth-token", "-password", "-secret")
    )


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ModelProfile(StrictModel):
    repository: str = Field(min_length=1)
    revision: str = Field(pattern=r"^[0-9a-f]{40}$")
    served_name: str = Field(min_length=1)
    quantization: str = Field(min_length=1)


class RecipeProfile(StrictModel):
    repository: str
    commit: str = Field(pattern=r"^[0-9a-f]{7,40}$")
    path: str
    profile: str
    deviations: list[str]


class ServeProfile(BaseModel):
    model_config = ConfigDict(extra="allow")

    max_model_len: int = Field(gt=0)
    max_num_seqs: int = Field(gt=0)
    max_num_batched_tokens: int = Field(gt=0)
    kv_cache_dtype: str
    attention_backend: str
    moe_backend: str
    enable_prefix_caching: bool


class RuntimeProfile(StrictModel):
    engine: Literal["vllm"] = "vllm"
    version: str
    executable: Path
    manifest: Path
    env: dict[str, str] = Field(default_factory=dict)
    serve_args: ServeProfile
    recipe: RecipeProfile

    @model_validator(mode="after")
    def keep_credentials_out_of_process_arguments(self) -> RuntimeProfile:
        sensitive = [
            name
            for name in self.serve_args.model_dump()
            if _is_credential_flag("--" + name.replace("_", "-"))
        ]
        if sensitive:
            raise ValueError(
                "credential-bearing serve_args are forbidden; pass secrets in runtime.env"
            )
        return self


class EndpointProfile(StrictModel):
    host: Literal["127.0.0.1", "localhost"] = "127.0.0.1"
    port: int = Field(ge=1, le=65535)
    api_key: Literal["EMPTY"] = "EMPTY"

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}/v1"


class GenerationProfile(StrictModel):
    max_tokens: int = Field(gt=0, le=16384)
    reasoning_token_budget: int = Field(gt=0, le=8192)
    sampling_source: str = "profile"
    do_sample: bool
    temperature: float = Field(ge=0)
    top_p: float = Field(gt=0, le=1)
    top_k: int = Field(gt=0)

    @model_validator(mode="after")
    def reserve_final_answer_tokens(self) -> GenerationProfile:
        if self.reasoning_token_budget >= self.max_tokens:
            raise ValueError("reasoning_token_budget must be less than max_tokens")
        if self.do_sample and self.temperature == 0:
            raise ValueError("sampled generation requires a positive temperature")
        if not self.do_sample and self.temperature != 0:
            raise ValueError("non-sampled generation requires temperature 0")
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
    name: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
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


def _disk_free_gib(path: Path) -> float:
    """Return free space for the filesystem that will contain ``path``."""
    existing = path.expanduser().resolve()
    while not existing.exists():
        parent = existing.parent
        if parent == existing:
            raise ValueError(f"no existing parent for artifact root: {path}")
        existing = parent
    return shutil.disk_usage(existing).free / 1024**3


def preflight(profile: LocalBenchmarkProfile, artifact_root: Path) -> None:
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
    disk_free = _disk_free_gib(artifact_root)
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
    status = subprocess.run(
        ["git", "status", "--porcelain=v1"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    if status:
        raise RuntimeError("benchmark runs require a clean Git working tree")


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
    for name, value in profile.runtime.serve_args.model_dump().items():
        if isinstance(value, bool):
            args.append(_flag(name) if value else _flag(f"no_{name}"))
        elif isinstance(value, (dict, list)):
            args.extend([_flag(name), json.dumps(value, separators=(",", ":"))])
        elif value is not None:
            args.extend([_flag(name), str(value)])
    return args


def _redact_server_args(args: list[str]) -> list[str]:
    redacted = args.copy()
    for index, value in enumerate(redacted):
        flag = value.split("=", 1)[0]
        credential_flag = _is_credential_flag(flag)
        if credential_flag and "=" not in value and index + 1 < len(redacted):
            redacted[index + 1] = "<redacted>"
        elif credential_flag and "=" in value:
            redacted[index] = f"{flag}=<redacted>"
    return redacted


def _request_extra_body(profile: LocalBenchmarkProfile) -> dict[str, Any]:
    return {
        "chat_template_kwargs": {"enable_thinking": True},
        "thinking_token_budget": profile.generation.reasoning_token_budget,
        "top_k": profile.generation.top_k,
    }


def _generate_config(profile: LocalBenchmarkProfile) -> dict[str, Any]:
    return {
        "temperature": profile.generation.temperature,
        "top_p": profile.generation.top_p,
        "extra_body": _request_extra_body(profile),
    }


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
        if _has_zombie_descendant(process.pid):
            raise RuntimeError("server worker exited during guarded startup")
        try:
            client.models.list()
            return
        except Exception as error:  # endpoint is expected to refuse during startup
            last_error = error
            time.sleep(2)
    raise TimeoutError(f"server did not become ready: {last_error}")


def _has_zombie_descendant(root_pid: int) -> bool:
    process_rows = subprocess.run(
        ["ps", "-eo", "pid=,ppid=,stat="],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.splitlines()
    children: dict[int, list[tuple[int, str]]] = {}
    for row in process_rows:
        pid_text, parent_text, state = row.split(maxsplit=2)
        children.setdefault(int(parent_text), []).append((int(pid_text), state))

    pending = [root_pid]
    while pending:
        parent = pending.pop()
        for child, state in children.get(parent, []):
            if state.startswith("Z"):
                return True
            pending.append(child)
    return False


def _assert_guard_healthy(
    process: subprocess.Popen[str], server_log_path: Path
) -> None:
    returncode = process.poll()
    log = (
        server_log_path.read_text(encoding="utf-8", errors="replace")
        if server_log_path.is_file()
        else ""
    )
    pressure_killed = returncode == 137 or (
        "guarded-launch: killing " in log
        and ("MemAvailable " in log or "SwapFree " in log)
        and " below " in log
    )
    if pressure_killed:
        raise RuntimeError("memory guard pressure-killed the local server")
    if returncode is not None:
        raise RuntimeError(f"guarded server exited with status {returncode}")


def _external_artifact_root(artifact_root: Path) -> Path:
    resolved = artifact_root.expanduser().resolve()
    if resolved == REPO_ROOT or REPO_ROOT in resolved.parents:
        raise ValueError("artifact root must be outside the Git working tree")
    return resolved


def _smoke(client: OpenAI, profile: LocalBenchmarkProfile) -> dict[str, Any]:
    item = load_curated_items()[0]
    response = client.chat.completions.create(
        model=profile.model.served_name,
        messages=[
            {"role": "system", "content": _system_prompt(True)},
            {"role": "user", "content": item.source},
        ],
        max_tokens=profile.generation.max_tokens,
        temperature=profile.generation.temperature,
        top_p=profile.generation.top_p,
        extra_body=_request_extra_body(profile),
    )
    message = response.choices[0].message
    extras = message.model_extra or {}
    reasoning = extras.get("reasoning_content") or extras.get("reasoning")
    content = message.content or ""
    if reasoning:
        reasoning_text = str(reasoning).strip()
        final_answer = content.strip()
    else:
        reasoning_text, final_answer = raw_thinking_parts(content)
    if not reasoning_text:
        raise RuntimeError("thinking was enabled but no reasoning was observed")
    if not final_answer:
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
        "--max-retries",
        "2",
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
        "working_tree_changes": [],
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
                "arguments": _redact_server_args(server_args),
                "max_model_len": serve.max_model_len,
                "max_num_seqs": serve.max_num_seqs,
                "max_num_batched_tokens": serve.max_num_batched_tokens,
                "kv_cache_dtype": serve.kv_cache_dtype,
                "attention_backend": serve.attention_backend,
                "moe_backend": serve.moe_backend,
                "prefix_caching": serve.enable_prefix_caching,
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
    artifact_root = _external_artifact_root(artifact_root)
    preflight(profile, artifact_root)
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
        json.dumps(_generate_config(profile), indent=2) + "\n",
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
        _assert_guard_healthy(guard_process, server_log_path)
        logs = list(log_dir.glob("*.eval"))
        if len(logs) != 1:
            raise RuntimeError(f"expected one Inspect log, found {len(logs)}")
        metadata = _metadata(profile, run_id, server_args, artifact_dir)
        metadata["artifacts"]["inspect_log"] = str(logs[0])
        result = build_result(logs[0], metadata)
        _assert_guard_healthy(guard_process, server_log_path)
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
        artifact_root = _external_artifact_root(args.artifact_root)
        preflight(profile, artifact_root)
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
