import copy
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, ValidationError

from alman.bench.local_run import (
    LocalBenchmarkProfile,
    _assert_guard_healthy,
    _disk_free_gib,
    _external_artifact_root,
    _generate_config,
    _has_zombie_descendant,
    _redact_server_args,
    _inspect_command,
    _serve_args,
    guarded_command,
)
from alman.bench.hf_run import (
    _aggregate,
    _artifact_batch_dir,
    _external_artifact_root as _external_hf_artifact_root,
    _load_jsonl,
    _response_data,
    _validate_profiles,
    validate_hosted_result,
)
from alman.bench.results import (
    DEFAULT_SCHEMA,
    _has_reasoning_content,
    _score,
    raw_thinking_parts,
    validate_result,
)


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
            "generation": {
                "max_tokens": 8192,
                "reasoning_token_budget": 4096,
                "do_sample": True,
                "temperature": 1.0,
                "top_p": 0.95,
                "top_k": 20,
                "presence_penalty": 1.5,
            },
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
    score = {"correct": 48, "total": 48, "rate": 1.0, "stderr": 0.0}
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
            "raw_sample_count": 48,
            "sample_count": 48,
            "excluded_spec_example_count": 0,
            "excluded_spec_example_ids": [],
            "spec_in_context": True,
            "spec_examples_in_dataset": False,
            "commit": "a" * 40,
            "working_tree_dirty": False,
            "working_tree_changes": [],
        },
        "model": {
            "repository": "example/model",
            "revision": "b" * 40,
            "served_name": "test",
            "quantization": "NVFP4",
            "thinking": {
                "enabled": True,
                "verification_method": "reasoning_content",
                "verified_sample_count": 48,
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
            "reasoning_token_budget": 4096,
            "sampling_source": "model_generation_config",
            "do_sample": True,
            "temperature": 1.0,
            "top_p": 0.95,
            "top_k": 20,
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
            "samples_with_reasoning": 48,
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


def test_result_rejects_moving_model_revision(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["model"]["revision"] = "main"
    with pytest.raises(ValidationError):
        validate_result(invalid)


def test_result_rejects_unidentified_dirty_tree(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["benchmark"]["working_tree_dirty"] = True
    with pytest.raises(ValueError, match="must include identified changes"):
        validate_result(invalid)


def test_result_rejects_inconsistent_rate(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["results"]["acceptance"]["rate"] = 0.5
    with pytest.raises(ValueError, match="rate does not match"):
        validate_result(invalid)


def test_result_rejects_inconsistent_stderr(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["results"]["acceptance"]["stderr"] = 0.5
    with pytest.raises(ValueError, match="stderr does not match"):
        validate_result(invalid)


def test_result_rejects_missing_thinking(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["model"]["thinking"]["verified_sample_count"] = 0
    with pytest.raises(ValidationError):
        validate_result(invalid)


def test_result_rejects_incomplete_compliance_counts(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["results"]["compliance"] = {
        "correct": 1,
        "total": 1,
        "rate": 1.0,
        "stderr": 0.0,
    }
    with pytest.raises(ValueError, match="evaluated sample count"):
        validate_result(invalid)


def test_result_rejects_group_correct_mismatch(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["results"]["groups"]["example"] = {
        "correct": 47,
        "total": 48,
        "rate": 47 / 48,
        "stderr": ((47 / 48) * (1 / 48) / 48) ** 0.5,
    }
    with pytest.raises(ValueError, match="group correct counts"):
        validate_result(invalid)


def test_result_rejects_reasoning_count_mismatch(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["model"]["thinking"]["verified_sample_count"] = 47
    with pytest.raises(ValueError, match="reasoning sample counts must match"):
        validate_result(invalid)


def test_result_rejects_reasoning_budget_without_final_answer_room(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["generation"]["reasoning_token_budget"] = 8192
    with pytest.raises(ValueError, match="leave room for a final answer"):
        validate_result(invalid)


def test_score_uses_exact_counts():
    assert _score(45, 48)["rate"] == 0.9375


def test_result_rejects_inconsistent_excluded_count(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["benchmark"]["raw_sample_count"] = 50
    invalid["benchmark"]["excluded_spec_example_count"] = 2
    with pytest.raises(ValueError, match="count must match its id list"):
        validate_result(invalid)


def test_result_rejects_incorrect_excluded_ids(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["benchmark"]["raw_sample_count"] = 50
    invalid["benchmark"]["excluded_spec_example_count"] = 2
    invalid["benchmark"]["excluded_spec_example_ids"] = [
        "curated/berufe/2",
        "curated/berufe/3",
    ]
    with pytest.raises(ValidationError):
        validate_result(invalid)


def test_result_rejects_partial_known_overlap_set(valid_result):
    invalid = copy.deepcopy(valid_result)
    invalid["benchmark"]["raw_sample_count"] = 49
    invalid["benchmark"]["excluded_spec_example_count"] = 1
    invalid["benchmark"]["excluded_spec_example_ids"] = ["curated/berufe/0"]
    with pytest.raises(ValueError, match="complete known pair"):
        validate_result(invalid)


def test_serve_command_enables_thinking(profile):
    args = _serve_args(profile)
    kwargs_index = args.index("--default-chat-template-kwargs")
    assert args[kwargs_index + 1] == '{"enable_thinking":true}'
    assert "--no-enable-prefix-caching" in args
    assert "--revision" in args


def test_server_arguments_redact_api_key():
    assert _redact_server_args(["vllm", "--api-key", "secret"]) == [
        "vllm",
        "--api-key",
        "<redacted>",
    ]
    assert _redact_server_args(["vllm", "--api-key=secret"]) == [
        "vllm",
        "--api-key=<redacted>",
    ]
    assert _redact_server_args(["vllm", "--hf-token", "hf_secret"]) == [
        "vllm",
        "--hf-token",
        "<redacted>",
    ]
    assert _redact_server_args(["vllm", "--auth-token=secret"]) == [
        "vllm",
        "--auth-token=<redacted>",
    ]


def test_generate_config_applies_recorded_sampling(profile):
    assert profile.generation.sampling_source == "profile"
    assert _generate_config(profile) == {
        "temperature": 1.0,
        "top_p": 0.95,
        "presence_penalty": 1.5,
        "extra_body": {
            "chat_template_kwargs": {"enable_thinking": True},
            "thinking_token_budget": 4096,
            "top_k": 20,
        },
    }


def test_raw_think_block_counts_as_reasoning():
    assert _has_reasoning_content("<think>reasoning</think>answer")
    assert not _has_reasoning_content("<think></think>answer")
    assert not _has_reasoning_content("<think>   </think>answer")
    assert not _has_reasoning_content("<think>unfinished")
    assert not _has_reasoning_content("answer only")


def test_raw_thinking_parts_require_reasoning_and_final_answer():
    assert raw_thinking_parts("<think>reasoning</think> answer") == (
        "reasoning",
        "answer",
    )
    assert raw_thinking_parts("<think></think>") == ("", "")
    assert raw_thinking_parts("<think>reasoning</think>") == ("reasoning", "")


def test_guard_wraps_vllm_command(profile):
    command = guarded_command(profile)
    separator = command.index("--")
    assert command[0] == str(profile.safety.guard)
    assert command[separator + 1] == str(profile.runtime.executable)
    assert command[separator + 2] == "serve"


def test_inspect_command_uses_reasoning_budget_config(profile, tmp_path):
    generate_config = tmp_path / "generate-config.json"
    command = _inspect_command(profile, tmp_path, "run-id", generate_config)
    assert command[command.index("--generate-config") + 1] == str(generate_config)
    assert "reasoning_token_budget=4096" in command
    assert command[command.index("--max-retries") + 1] == "2"


def test_profile_requires_final_answer_budget(profile):
    payload = profile.model_dump()
    payload["generation"]["reasoning_token_budget"] = 8192
    with pytest.raises(ValueError, match="must be less than max_tokens"):
        LocalBenchmarkProfile.model_validate(payload)


@pytest.mark.parametrize("host", ["0.0.0.0", "192.0.2.1"])
def test_profile_requires_loopback_endpoint(profile, host):
    payload = profile.model_dump()
    payload["endpoint"]["host"] = host
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


def test_profile_requires_immutable_model_revision(profile):
    payload = profile.model_dump()
    payload["model"]["revision"] = "main"
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


@pytest.mark.parametrize("field", ["repository", "served_name", "quantization"])
def test_profile_requires_recordable_model_fields(profile, field):
    payload = profile.model_dump()
    payload["model"][field] = ""
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


def test_profile_rejects_credentials_in_server_arguments(profile):
    payload = profile.model_dump()
    payload["runtime"]["serve_args"]["hf_token"] = "secret"
    with pytest.raises(ValueError, match="credential-bearing serve_args"):
        LocalBenchmarkProfile.model_validate(payload)


def test_profile_requires_recorded_server_settings(profile):
    payload = profile.model_dump()
    del payload["runtime"]["serve_args"]["max_num_seqs"]
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


@pytest.mark.parametrize("name", ["thinking profile", "thinking/profile", ""])
def test_profile_name_must_fit_result_id(profile, name):
    payload = profile.model_dump()
    payload["name"] = name
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


def test_profile_requires_nonsecret_local_api_key(profile):
    payload = profile.model_dump()
    payload["endpoint"]["api_key"] = "secret"
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


def test_profile_requires_vllm_runtime(profile):
    payload = profile.model_dump()
    payload["runtime"]["engine"] = "other"
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


@pytest.mark.parametrize(
    ("section", "field"),
    [
        ("runtime", "executable"),
        ("runtime", "manifest"),
        ("safety", "guard"),
    ],
)
def test_profile_requires_absolute_process_paths(profile, section, field):
    payload = profile.model_dump()
    payload[section][field] = Path("relative/path")
    with pytest.raises(ValueError, match="must be absolute"):
        LocalBenchmarkProfile.model_validate(payload)


@pytest.mark.parametrize("commit", ["", "main", "a" * 41])
def test_profile_requires_valid_recipe_commit(profile, commit):
    payload = profile.model_dump()
    payload["runtime"]["recipe"]["commit"] = commit
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


@pytest.mark.parametrize("port", [0, -1, 65536])
def test_profile_requires_valid_tcp_port(profile, port):
    payload = profile.model_dump()
    payload["endpoint"]["port"] = port
    with pytest.raises(ValueError):
        LocalBenchmarkProfile.model_validate(payload)


def test_zombie_descendant_detection(monkeypatch):
    class Completed:
        stdout = "10 1 S\n11 10 S\n12 11 Z\n20 1 Z\n"

    monkeypatch.setattr(
        "alman.bench.local_run.subprocess.run", lambda *a, **k: Completed()
    )
    assert _has_zombie_descendant(10)
    assert not _has_zombie_descendant(20)


@pytest.mark.parametrize(
    ("returncode", "log"),
    [
        (137, ""),
        (
            None,
            "guarded-launch: killing test process group 123: "
            "MemAvailable 1KiB below 2KiB\n",
        ),
    ],
)
def test_guard_health_rejects_pressure_kill(tmp_path, returncode, log):
    class Process:
        def poll(self):
            return returncode

    server_log = tmp_path / "server.log"
    server_log.write_text(log, encoding="utf-8")
    with pytest.raises(RuntimeError, match="pressure-killed"):
        _assert_guard_healthy(Process(), server_log)


def test_guard_health_accepts_running_process(tmp_path):
    class Process:
        def poll(self):
            return None

    server_log = tmp_path / "server.log"
    server_log.write_text("guarded-launch: starting test\n", encoding="utf-8")
    _assert_guard_healthy(Process(), server_log)


def test_artifact_root_must_be_outside_worktree(tmp_path):
    from alman.bench.local_run import REPO_ROOT

    with pytest.raises(ValueError, match="outside the Git working tree"):
        _external_artifact_root(REPO_ROOT / "local-benchmark-artifacts")
    assert _external_artifact_root(tmp_path) == tmp_path.resolve()


def test_disk_free_uses_nearest_existing_artifact_parent(tmp_path, monkeypatch):
    checked = []

    class Usage:
        free = 12 * 1024**3

    def fake_disk_usage(path):
        checked.append(path)
        return Usage()

    monkeypatch.setattr("alman.bench.local_run.shutil.disk_usage", fake_disk_usage)
    artifact_root = tmp_path / "not-created" / "runs"

    assert _disk_free_gib(artifact_root) == 12
    assert checked == [tmp_path]


def test_hosted_response_extracts_reasoning_tokens():
    class Value:
        def __init__(self, **values):
            self.__dict__.update(values)

        def model_dump(self):
            return self.__dict__

    response = Value(
        id="response-id",
        model="deepseek/deepseek-v4-flash",
        choices=[
            Value(
                finish_reason="stop",
                message=Value(
                    content="die Haus",
                    reasoning_content="reasoning",
                    reasoning=None,
                ),
            )
        ],
        usage=Value(
            prompt_tokens=10,
            completion_tokens=20,
            total_tokens=30,
            completion_tokens_details={"reasoning_tokens": 12},
        ),
    )
    data = _response_data(response)
    assert data["content"] == "die Haus"
    assert data["reasoning"] == "reasoning"
    assert data["tokens"] == {
        "input": 10,
        "output": 20,
        "reasoning": 12,
        "total": 30,
    }


def test_hosted_aggregate_is_distinct_and_valid(tmp_path):
    samples = []
    for index in range(48):
        samples.append(
            {
                "id": f"curated/example/{index}",
                "paragraph": "example",
                "correct": index < 24,
                "compliant": True,
                "thinking_observed": True,
                "forced_final": False,
                "tokens": {"input": 10, "output": 20, "reasoning": 12, "total": 30},
            }
        )
    result = _aggregate(
        profile={
            "name": "deepseek-v4-flash-hf-novita-thinking",
            "model": "deepseek-ai/DeepSeek-V4-Flash",
            "hub_revision": "a" * 40,
            "provider_model_id": "deepseek/deepseek-v4-flash",
            "thinking_control": "reasoning.effort=low",
            "thinking_extra_body": {
                "reasoning": {"effort": "low"},
                "separate_reasoning": True,
            },
            "forced_final_extra_body": {"enable_thinking": False},
            "forced_final_disables_thinking": True,
            "forced_final_max_tokens": 512,
            "temperature": 1.0,
            "top_p": 1.0,
            "provider": "novita",
            "input_price_per_million": 0.14,
            "output_price_per_million": 0.28,
            "pricing_observed_at": "2026-07-11T00:00:00Z",
        },
        samples=samples,
        started_at="2026-07-11T00:00:00+00:00",
        completed_at="2026-07-11T00:01:00+00:00",
        commit="b" * 40,
        artifact_path=tmp_path / "samples.jsonl",
    )
    assert result["endpoint"]["platform"] == "huggingface-inference-providers"
    assert result["results"]["acceptance"]["correct"] == 24
    assert result["model"]["thinking"]["thinking_call_max_tokens"] == 4096
    assert result["model"]["thinking"]["max_reported_reasoning_tokens"] == 12
    assert result["model"]["thinking"]["max_thinking_call_completion_tokens"] == 20
    assert result["model"]["served_revision_pinned"] is False

    invalid = copy.deepcopy(result)
    invalid["results"]["acceptance"]["total"] = 47
    invalid["results"]["acceptance"]["rate"] = 24 / 47
    invalid["results"]["acceptance"]["stderr"] = (24 / 47 * 23 / 47 / 47) ** 0.5
    with pytest.raises(ValueError, match="headline score totals"):
        validate_hosted_result(invalid)

    invalid = copy.deepcopy(result)
    invalid["results"]["acceptance"]["stderr"] = 0.5
    with pytest.raises(ValueError, match="stderr"):
        validate_hosted_result(invalid)

    invalid = copy.deepcopy(result)
    invalid["results"]["groups"]["example"]["correct"] = 23
    invalid["results"]["groups"]["example"]["rate"] = 23 / 48
    invalid["results"]["groups"]["example"]["stderr"] = (23 / 48 * 25 / 48 / 48) ** 0.5
    with pytest.raises(ValueError, match="group correct counts"):
        validate_hosted_result(invalid)


def test_hosted_profiles_are_validated_before_use():
    profile = {
        "name": "deepseek-v4-flash-hf-novita-thinking",
        "model": "deepseek-ai/DeepSeek-V4-Flash",
        "hub_revision": "a" * 40,
        "provider": "novita",
        "provider_model_id": "deepseek/deepseek-v4-flash",
        "thinking_control": "reasoning.effort=low",
        "thinking_extra_body": {"reasoning": {"effort": "low"}},
        "forced_final_extra_body": {"enable_thinking": False},
        "forced_final_disables_thinking": True,
        "temperature": 1.0,
        "top_p": 1.0,
        "input_price_per_million": 0.14,
        "output_price_per_million": 0.28,
        "pricing_observed_at": "2026-07-11T00:00:00Z",
        "output": "result.json",
    }
    _validate_profiles([profile])
    invalid = copy.deepcopy(profile)
    invalid["provider"] = "auto"
    with pytest.raises(ValidationError):
        _validate_profiles([invalid])

    duplicate = copy.deepcopy(profile)
    duplicate["name"] = "another-profile"
    with pytest.raises(ValueError, match="output values must be unique"):
        _validate_profiles([profile, duplicate])


def test_hosted_artifacts_must_stay_outside_worktree(tmp_path):
    from alman.bench.hf_run import REPO_ROOT

    with pytest.raises(ValueError, match="outside the Git working tree"):
        _external_hf_artifact_root(REPO_ROOT / "artifacts")
    assert _external_hf_artifact_root(tmp_path) == tmp_path.resolve()


@pytest.mark.parametrize("batch_id", ["../escape", "/tmp/escape", ".", ".."])
def test_hosted_batch_id_cannot_escape_artifact_root(tmp_path, batch_id):
    with pytest.raises(ValueError):
        _artifact_batch_dir(tmp_path.resolve(), batch_id)
    assert _artifact_batch_dir(tmp_path.resolve(), "safe-batch") == (
        tmp_path / "safe-batch"
    ).resolve()


def test_hosted_resume_ignores_only_a_truncated_final_record(tmp_path):
    path = tmp_path / "samples.jsonl"
    path.write_text('{"id":"first"}\n{"id":', encoding="utf-8")
    assert _load_jsonl(path) == [{"id": "first"}]
    assert path.read_text(encoding="utf-8") == '{"id":"first"}\n'

    path.write_text('{"id":\n{"id":"second"}\n', encoding="utf-8")
    with pytest.raises(json.JSONDecodeError):
        _load_jsonl(path)

    path.write_text('{"id":"first"}\n{"id":\n', encoding="utf-8")
    with pytest.raises(json.JSONDecodeError):
        _load_jsonl(path)

    path.write_text('{"id":"first"}', encoding="utf-8")
    assert _load_jsonl(path) == [{"id": "first"}]
    assert path.read_text(encoding="utf-8").endswith("\n")
