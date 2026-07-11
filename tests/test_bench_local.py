import copy
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, ValidationError

from alman.bench.local_run import LocalBenchmarkProfile, _serve_args, guarded_command
from alman.bench.results import DEFAULT_SCHEMA, _score, validate_result


@pytest.fixture
def profile(tmp_path: Path) -> LocalBenchmarkProfile:
    executable = tmp_path / "vllm"
    manifest = tmp_path / "manifest.json"
    guard = tmp_path / "guarded-launch.sh"
    executable.touch()
    executable.chmod(0o755)
    manifest.write_text("{}", encoding="utf-8")
    guard.touch()
    guard.chmod(0o755)
    return LocalBenchmarkProfile.model_validate(
        {
            "name": "test-thinking",
            "model": {
                "repository": "example/model",
                "revision": "a" * 40,
                "served_name": "test-model",
                "quantization": "NVFP4",
            },
            "runtime": {
                "version": "0.24.0",
                "executable": str(executable),
                "manifest": str(manifest),
                "env": {"EXAMPLE": "1"},
                "serve_args": {
                    "max_model_len": 32768,
                    "max_num_seqs": 4,
                    "max_num_batched_tokens": 16384,
                    "kv_cache_dtype": "fp8",
                    "attention_backend": "flashinfer",
                    "moe_backend": "marlin",
                    "enable_prefix_caching": False,
                    "default_chat_template_kwargs": {"enable_thinking": True},
                },
                "recipe": {
                    "repository": "https://github.com/osolmaz/localperf",
                    "commit": "b" * 40,
                    "path": "examples/model.json",
                    "profile": "32k",
                    "deviations": ["thinking enabled"],
                },
            },
            "endpoint": {"port": 9999},
            "generation": {"max_tokens": 8192},
            "safety": {
                "guard": str(guard),
                "min_mem_available_gib": 24,
                "min_swap_free_gib": 4,
                "min_disk_free_gib": 8,
                "startup_timeout_seconds": 1200,
                "request_timeout_seconds": 600,
            },
            "hardware": {
                "accelerator": "NVIDIA GB10",
                "unified_memory_gib": 121,
            },
        }
    )


@pytest.fixture
def valid_result() -> dict:
    score = {"correct": 50, "total": 50, "rate": 1.0, "stderr": 0.0}
    return {
        "$schema": "./result.schema.json",
        "schema_version": 1,
        "run": {
            "id": "20260711T120000Z-test",
            "started_at": "2026-07-11T12:00:00Z",
            "completed_at": "2026-07-11T12:01:00Z",
            "status": "success",
        },
        "benchmark": {
            "task": "alman_bench",
            "dataset": "curated",
            "sample_count": 50,
            "spec_in_context": True,
            "spec_examples_in_dataset": False,
            "commit": "a" * 40,
            "working_tree_dirty": False,
        },
        "model": {
            "repository": "example/model",
            "revision": "b" * 40,
            "served_name": "test",
            "quantization": "NVFP4",
            "thinking": {
                "enabled": True,
                "verification_method": "reasoning_content",
                "verified_sample_count": 50,
            },
        },
        "endpoint": {
            "provider": "inspect-openai-api",
            "api": "chat_completions",
            "base_url": "http://127.0.0.1:9000/v1",
            "max_connections": 1,
            "max_samples": 1,
        },
        "runtime": {
            "engine": "vllm",
            "version": "0.24.0",
            "executable": "/home/user/runtimes/vllm/bin/vllm",
            "manifest": "/home/user/runtimes/vllm/manifest.json",
            "recipe": {
                "repository": "https://github.com/osolmaz/localperf",
                "commit": "c" * 40,
                "path": "examples/model.json",
                "profile": "32k",
                "deviations": ["enable thinking"],
            },
            "server": {
                "arguments": ["vllm", "serve", "example/model"],
                "max_model_len": 32768,
                "max_num_seqs": 4,
                "max_num_batched_tokens": 16384,
                "kv_cache_dtype": "fp8",
                "attention_backend": "flashinfer",
                "moe_backend": "marlin",
                "prefix_caching": False,
            },
        },
        "generation": {
            "max_tokens": 8192,
            "sampling_source": "model_generation_config",
        },
        "hardware": {"accelerator": "NVIDIA GB10", "unified_memory_gib": 121},
        "memory_guard": {
            "process_guard": "/path/guarded-launch.sh",
            "earlyoom": True,
            "memory_available_floor_gib": 24,
            "swap_free_floor_gib": 4,
            "pressure_kill_occurred": False,
        },
        "results": {
            "duration_seconds": 60,
            "acceptance": score,
            "compliance": score,
            "groups": {"example": score},
            "tokens": {
                "input": 100,
                "cached_input": None,
                "output": 50,
                "reasoning": None,
                "total": 150,
            },
            "samples_with_reasoning": 50,
        },
        "artifacts": {
            "inspect_log": "/tmp/run.eval",
            "server_log": "/tmp/server.log",
            "smoke_response": "/tmp/smoke.json",
        },
    }


def test_result_schema_is_valid_json_schema():
    import json

    Draft202012Validator.check_schema(
        json.loads(DEFAULT_SCHEMA.read_text(encoding="utf-8"))
    )


def test_valid_result(valid_result):
    validate_result(valid_result)


def test_result_rejects_spec_examples(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["benchmark"]["spec_examples_in_dataset"] = True
    with pytest.raises(ValidationError):
        validate_result(invalid)


def test_result_rejects_inconsistent_rate(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["results"]["acceptance"]["rate"] = 0.5
    with pytest.raises(ValueError, match="rate does not match"):
        validate_result(invalid)


def test_result_rejects_missing_thinking(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["model"]["thinking"]["verified_sample_count"] = 0
    with pytest.raises(ValidationError):
        validate_result(invalid)


def test_score_uses_exact_counts():
    assert _score(47, 50)["rate"] == 0.94


def test_serve_command_enables_thinking(profile):
    args = _serve_args(profile)
    kwargs_index = args.index("--default-chat-template-kwargs")
    assert args[kwargs_index + 1] == '{"enable_thinking":true}'
    assert "--no-enable-prefix-caching" in args
    assert "--revision" in args


def test_guard_wraps_vllm_command(profile):
    command = guarded_command(profile)
    separator = command.index("--")
    assert command[0] == str(profile.safety.guard)
    assert command[separator + 1] == str(profile.runtime.executable)
    assert command[separator + 2] == "serve"
