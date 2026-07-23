"""Tests for the standardized run pipeline: dataset, registry, exporter."""

import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from alman.bench.almanbench import ALMANBENCH_DIR, case_set_identity
from alman.bench.export import _completion_parts, estimated_cost_usd, export_log
from alman.bench.registry import Profile, load_profile, load_registry
from alman.bench.scoring import split_thinking
from alman.bench.task import alman_bench, almanbench_samples


class TestAlmanBenchDataset:
    def test_case_set_matches_canonical_loaders(self):
        """The task assembles exactly the case set the rescore tooling builds
        from the canonical loaders: same rows, same identity hash. This is
        the parity gate with stored run artifacts (verified against the
        2026-07-17 runs, sha256:a8d75377...)."""
        from alman.bench.almanbench import load_almanbench_items
        from alman.bench.dataset import load_curated_items

        samples = almanbench_samples()
        sample_rows = [
            {
                "id": sample.id,
                "source": sample.input,
                "accepted": list(sample.target),
                "collection": sample.metadata["collection"],
            }
            for sample in samples
        ]
        loader_rows = [
            {
                "id": item.id,
                "source": item.source,
                "accepted": item.accepted,
                "collection": item.paragraph,
            }
            for item in load_curated_items()
        ] + [
            {
                "id": item.id,
                "source": item.source,
                "accepted": item.accepted,
                "collection": item.tier,
            }
            for item in load_almanbench_items()
        ]
        manifest = json.loads(
            (ALMANBENCH_DIR / "manifest.json").read_text(encoding="utf-8")
        )
        assert len(samples) == sum(manifest["tiers"].values()) + 93
        assert case_set_identity(sample_rows) == case_set_identity(loader_rows)

    def test_ids_unique(self):
        ids = [sample.id for sample in almanbench_samples()]
        assert len(ids) == len(set(ids))

    def test_tier_composition(self):
        samples = almanbench_samples()
        by_tier = {}
        for sample in samples:
            tier = sample.metadata["tier"]
            by_tier[tier] = by_tier.get(tier, 0) + 1
        assert by_tier == {
            "curated": 93,
            "naturalistic": 600,
            "targeted": 216,
            "guards": 120,
        }

    def test_task_tier_filter(self):
        task = alman_bench(dataset="almanbench", tiers="guards,curated")
        assert len(task.dataset) == 213
        assert {s.metadata["tier"] for s in task.dataset} == {"guards", "curated"}

    def test_task_rejects_unknown_tier(self):
        with pytest.raises(ValueError, match="subset"):
            alman_bench(dataset="almanbench", tiers="nope")

    def test_task_rejects_curated_filters(self):
        with pytest.raises(ValueError, match="filters by tier"):
            alman_bench(dataset="almanbench", paragraph="siddhartha")

    def test_tiers_rejected_outside_almanbench(self):
        with pytest.raises(ValueError, match="only to dataset='almanbench'"):
            alman_bench(dataset="curated", tiers="curated")


class TestSplitThinking:
    def test_plain_text_untouched(self):
        assert split_thinking("die Mann") == ("", "die Mann")

    def test_think_block_removed(self):
        reasoning, answer = split_thinking("<think>der wird die</think>\ndie Mann")
        assert reasoning == "der wird die"
        assert answer == "die Mann"

    def test_multiple_blocks_joined(self):
        reasoning, answer = split_thinking("<think>a</think>x<think>b</think> y")
        assert reasoning == "a\nb"
        assert answer == "x y"

    def test_unclosed_block_is_reasoning_not_answer(self):
        reasoning, answer = split_thinking("<think>abgeschnittene Ged")
        assert reasoning == "abgeschnittene Ged"
        assert answer == ""


class TestRegistry:
    def test_all_profiles_complete(self):
        for profile in load_registry().values():
            assert profile.label
            assert profile.model.count("/") >= 1
            assert profile.pricing is not None
            assert (
                "endpoint_per_hour_usd" in profile.pricing
                or (
                    "uncached_input_per_million_tokens" in profile.pricing
                    and "output_per_million_tokens" in profile.pricing
                )
            )
            assert "observed" in profile.pricing

    def test_env_expansion(self, monkeypatch):
        monkeypatch.setenv("HF_TOKEN", "hf_test")
        profile = load_profile("deepseek-v4-flash")
        env = profile.resolved_env()
        assert env["HF_API_KEY"] == "hf_test"
        assert env["HF_BASE_URL"].startswith("https://router.huggingface.co")

    def test_env_expansion_missing_var(self, monkeypatch):
        monkeypatch.delenv("HF_TOKEN", raising=False)
        with pytest.raises(KeyError, match="HF_TOKEN"):
            load_profile("deepseek-v4-flash").resolved_env()

    def test_unknown_profile(self):
        with pytest.raises(KeyError, match="unknown profile"):
            load_profile("no-such-model")

    def test_requested_model_strips_routing(self):
        assert (
            load_profile("deepseek-v4-flash").requested_model
            == "deepseek-ai/DeepSeek-V4-Flash:novita"
        )
        assert load_profile("gpt-5.6-sol-xhigh").requested_model == "gpt-5.6-sol"
        sol_max = load_profile("gpt-5.6-sol-max")
        assert sol_max.requested_model == "gpt-5.6-sol"
        assert sol_max.max_connections == 8
        assert sol_max.generate["extra_body"]["prompt_cache_key"] == (
            "almanbench-public"
        )
        assert load_profile("gpt-5.5-xhigh").requested_model == "gpt-5.5"
        assert load_profile("claude-opus-4.8-max").requested_model == "claude-opus-4-8"
        inkling = load_profile("inkling-max")
        assert inkling.requested_model == "thinkingmachines/Inkling:together"
        assert inkling.generate["reasoning_effort"] == "max"
        assert inkling.max_connections == 64
        assert load_profile("glm-5.2").model_args == {"stream": True}


class TestCost:
    def test_priced_per_million(self):
        tokens = {
            "uncached_input": 1_000_000,
            "cached_input": 2_000_000,
            "cache_creation_input": 0,
            "output": 500_000,
        }
        pricing = {
            "uncached_input_per_million_tokens": 2.0,
            "cached_input_per_million_tokens": 0.2,
            "output_per_million_tokens": 10.0,
        }
        assert estimated_cost_usd(tokens, pricing) == 2.0 + 0.4 + 5.0

    def test_no_pricing_is_none(self):
        assert estimated_cost_usd({}, None) is None

    def test_endpoint_pricing_uses_duration(self):
        pricing = {"endpoint_per_hour_usd": 10.0}
        assert estimated_cost_usd({}, pricing, duration_seconds=5400) == 15.0


MOCK_PROFILE = Profile(
    name="mock",
    label="Mock Model",
    platform="local",
    model="mockllm/model",
    pricing={
        "uncached_input_per_million_tokens": 1.0,
        "output_per_million_tokens": 2.0,
        "observed": "2026-07-17",
    },
)


@pytest.fixture(scope="module")
def mock_run(tmp_path_factory) -> tuple[Path, Path]:
    """A finished mockllm run over the curated tier, exported."""
    from inspect_ai import eval as inspect_eval

    root = tmp_path_factory.mktemp("mock-run")
    logs = inspect_eval(
        alman_bench(dataset="almanbench", tiers="curated"),
        model="mockllm/model",
        log_dir=str(root / "logs"),
        display="none",
    )
    assert logs[0].status == "success"
    out_dir = root / "artifacts"
    export_log(Path(logs[0].location), MOCK_PROFILE, out_dir, allow_dirty=True)
    return Path(logs[0].location), out_dir


class TestForcedFinal:
    def test_empty_answer_triggers_follow_up(self, tmp_path):
        """A response that is all reasoning and no final text gets one
        follow-up call, and the sample is marked forced_final."""
        from inspect_ai import eval as inspect_eval
        from inspect_ai.model import ModelOutput

        outputs = [
            ModelOutput.from_content(
                "mockllm/model", "<think>nur Nachdenken, keine Antwort</think>"
            ),
            ModelOutput.from_content("mockllm/model", "die Mann"),
        ]
        logs = inspect_eval(
            alman_bench(dataset="almanbench", tiers="curated"),
            model="mockllm/model",
            model_args={"custom_outputs": outputs},
            limit=1,
            log_dir=str(tmp_path / "logs"),
            display="none",
        )
        assert logs[0].status == "success"
        sample = logs[0].samples[0]
        assert sample.metadata.get("forced_final") is True
        assert sample.scores["acceptance"].answer == "die Mann"

        out_dir = tmp_path / "artifacts"
        export_log(Path(logs[0].location), MOCK_PROFILE, out_dir, allow_dirty=True)
        row = json.loads(
            (out_dir / "mock.samples.jsonl").read_text(encoding="utf-8").splitlines()[0]
        )
        assert row["forced_final"] is True
        assert row["output"] == "die Mann"
        # The primary turn's reasoning is preserved in the artifact.
        assert "nur Nachdenken" in row["reasoning"]
        assert row["thinking_observed"] is True


class TestExport:
    def test_effective_concurrency_overrides_retry_log_metadata(
        self, mock_run, tmp_path
    ):
        log_path, _ = mock_run
        out_dir = tmp_path / "effective-concurrency"
        aggregate = export_log(
            log_path,
            MOCK_PROFILE,
            out_dir,
            allow_dirty=True,
            max_connections=32,
        )
        assert aggregate["model"]["logged_generate_config"]["max_connections"] == 32
        manifest = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
        assert manifest["max_connections"] == 32

    def test_completion_falls_back_from_condensed_choice_attachment(self):
        from inspect_ai.model import ModelOutput

        output = ModelOutput.from_content("mockllm/model", "attachment://abc")
        output.completion = "die Mann"
        sample = SimpleNamespace(messages=[], output=output)

        assert _completion_parts(sample)[2] == "die Mann"

    def test_export_resolves_condensed_log_attachments(
        self, mock_run, tmp_path, monkeypatch
    ):
        import alman.bench.export as export_module

        log_path, _ = mock_run
        original = export_module.read_eval_log
        calls = []

        def read_with_recording(path, **kwargs):
            calls.append(kwargs)
            return original(path, **kwargs)

        monkeypatch.setattr(export_module, "read_eval_log", read_with_recording)
        export_log(log_path, MOCK_PROFILE, tmp_path / "out", allow_dirty=True)
        assert calls == [{"resolve_attachments": "core"}]

    def test_artifact_files_written(self, mock_run):
        _, out_dir = mock_run
        for name in (
            "mock.samples.jsonl",
            "mock.almanbench-results.jsonl",
            "mock.result.json",
            "manifest.json",
        ):
            assert (out_dir / name).exists()

    def test_aggregate_scores(self, mock_run):
        _, out_dir = mock_run
        aggregate = json.loads(
            (out_dir / "mock.result.json").read_text(encoding="utf-8")
        )
        acceptance = aggregate["results"]["acceptance"]
        assert acceptance["total"] == 93
        assert acceptance["correct"] == 0  # mockllm's canned output
        compliance = aggregate["results"]["compliance"]
        assert compliance["correct"] == 93  # ...which is lint-clean
        assert aggregate["results"]["tiers"]["curated"]["acceptance"]["total"] == 93
        assert aggregate["case_set_size"] == 93
        assert aggregate["model"]["label"] == "Mock Model"
        assert aggregate["model"]["model_args"] == {}

    def test_sample_rows_have_stable_schema(self, mock_run):
        _, out_dir = mock_run
        rows = [
            json.loads(line)
            for line in (out_dir / "mock.samples.jsonl")
            .read_text(encoding="utf-8")
            .splitlines()
        ]
        assert len(rows) == 93
        required = {
            "id",
            "source",
            "accepted",
            "collection",
            "paragraph",
            "metadata",
            "output",
            "reasoning",
            "reasoning_status",
            "thinking_observed",
            "forced_final",
            "correct",
            "compliant",
            "tokens",
            "run_id",
            "execution_id",
            "scoring_revision",
        }
        assert required <= set(rows[0])
        assert rows == sorted(rows, key=lambda row: row["id"])
        # These are exactly the fields the rescore tooling rewrites.
        assert all(isinstance(row["accepted"], list) for row in rows)
        assert all(row["correct"] is False for row in rows)

    def test_publication_rows_match_samples(self, mock_run):
        _, out_dir = mock_run
        flat = [
            json.loads(line)
            for line in (out_dir / "mock.almanbench-results.jsonl")
            .read_text(encoding="utf-8")
            .splitlines()
        ]
        assert len(flat) == 93
        assert flat[0]["model_id"] == "mock"
        assert flat[0]["benchmark_id"] == "almanbench-public"
        assert flat[0]["reasoning_effort"] is None

    def test_run_id_derives_from_start_time(self, mock_run):
        _, out_dir = mock_run
        rows = (out_dir / "mock.samples.jsonl").read_text(encoding="utf-8")
        run_id = json.loads(rows.splitlines()[0])["run_id"]
        assert run_id.startswith("mock-almanbench-public-")
        assert run_id.endswith("Z")

    def test_export_rejects_dirty_tree(self, mock_run, tmp_path, monkeypatch):
        import alman.bench.export as export_module

        log_path, _ = mock_run
        monkeypatch.setattr(
            export_module, "_scoring_revision", lambda: ("deadbeef", True)
        )
        with pytest.raises(ValueError, match="dirty"):
            export_log(log_path, MOCK_PROFILE, tmp_path / "out")

    def test_export_rejects_profile_model_mismatch(self, mock_run, tmp_path):
        log_path, _ = mock_run
        wrong = Profile(
            name="wrong",
            label="Wrong",
            platform="local",
            model="openai/some-other-model",
        )
        with pytest.raises(ValueError, match="profile 'wrong' declares"):
            export_log(log_path, wrong, tmp_path / "out")

    def test_export_rejects_declared_model_arg_mismatch(self, mock_run, tmp_path):
        log_path, _ = mock_run
        streaming = Profile(
            name="mock-streaming",
            label="Mock Streaming",
            platform="local",
            model="mockllm/model",
            model_args={"stream": True},
        )
        with pytest.raises(ValueError, match=r"model_args\['stream'\]=None"):
            export_log(log_path, streaming, tmp_path / "out", allow_dirty=True)

    def test_export_rejects_unfinished_or_wrong_dataset(self, mock_run, tmp_path):
        from inspect_ai import eval as inspect_eval

        logs = inspect_eval(
            alman_bench(dataset="curated"),
            model="mockllm/model",
            log_dir=str(tmp_path / "logs"),
            limit=1,
            display="none",
        )
        with pytest.raises(ValueError, match="dataset='almanbench'"):
            export_log(Path(logs[0].location), MOCK_PROFILE, tmp_path / "out")
