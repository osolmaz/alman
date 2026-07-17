"""Tests for the standardized run pipeline: dataset, registry, exporter."""

import json
from pathlib import Path

import pytest

from alman.bench.almanbench import ALMANBENCH_DIR, case_set_identity
from alman.bench.export import estimated_cost_usd, export_log
from alman.bench.registry import Profile, load_profile, load_registry
from alman.bench.scoring import split_thinking
from alman.bench.task import alman_bench, almanbench_samples


class TestAlmanbenchDataset:
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
        assert len(samples) == sum(manifest["tiers"].values()) + 89
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
            "curated": 89,
            "naturalistic": 600,
            "targeted": 216,
            "guards": 120,
        }

    def test_task_tier_filter(self):
        task = alman_bench(dataset="almanbench", tiers="guards,curated")
        assert len(task.dataset) == 209
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


class TestRegistry:
    def test_all_profiles_complete(self):
        for profile in load_registry().values():
            assert profile.label
            assert profile.model.count("/") >= 1
            assert profile.pricing is not None
            assert "uncached_input_per_million_tokens" in profile.pricing
            assert "output_per_million_tokens" in profile.pricing
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


MOCK_PROFILE = Profile(
    name="mock",
    label="Mock Model",
    platform="test",
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
    export_log(Path(logs[0].location), MOCK_PROFILE, out_dir)
    return Path(logs[0].location), out_dir


class TestExport:
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
        assert acceptance["total"] == 89
        assert acceptance["correct"] == 0  # mockllm's canned output
        compliance = aggregate["results"]["compliance"]
        assert compliance["correct"] == 89  # ...which is lint-clean
        assert aggregate["results"]["tiers"]["curated"]["acceptance"]["total"] == 89
        assert aggregate["case_set_size"] == 89
        assert aggregate["model"]["label"] == "Mock Model"

    def test_sample_rows_have_stable_schema(self, mock_run):
        _, out_dir = mock_run
        rows = [
            json.loads(line)
            for line in (out_dir / "mock.samples.jsonl")
            .read_text(encoding="utf-8")
            .splitlines()
        ]
        assert len(rows) == 89
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
        assert len(flat) == 89
        assert flat[0]["model_id"] == "mock"
        assert flat[0]["benchmark_id"] == "almanbench-public"

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
