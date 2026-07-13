import copy
from pathlib import Path

import pytest
from jsonschema import ValidationError

from alman.bench.anthropic_run import (
    _aggregate,
    _prewarm,
    _response_data,
    _run_sample,
    _system_blocks,
    _validate_profile,
    validate_anthropic_result,
)


def _profile() -> dict:
    return {
        "name": "claude-sonnet-5-xhigh",
        "model": "claude-sonnet-5",
        "label": "Claude Sonnet 5",
        "reasoning_effort": "xhigh",
        "forced_final_effort": "low",
        "cache_ttl": "1h",
        "max_concurrency": 4,
        "input_price_per_million": 2.0,
        "cache_write_5m_price_per_million": 2.5,
        "cache_write_1h_price_per_million": 4.0,
        "cache_read_price_per_million": 0.2,
        "output_price_per_million": 10.0,
        "pricing_observed_at": "2026-07-13T10:00:00Z",
        "introductory_pricing_ends": "2026-08-31",
        "output": "result.json",
    }


def _tokens(**overrides) -> dict:
    values = {
        "input": 5,
        "cache_read_input": 100,
        "cache_creation_input": 0,
        "cache_creation_5m_input": 0,
        "cache_creation_1h_input": 0,
        "output": 20,
        "reasoning": 12,
        "total": 125,
    }
    values.update(overrides)
    return values


def test_anthropic_profile_is_strict():
    _validate_profile(_profile())

    invalid = copy.deepcopy(_profile())
    invalid["cache_ttl"] = "5m"
    with pytest.raises(ValidationError):
        _validate_profile(invalid)

    invalid = copy.deepcopy(_profile())
    invalid["cache_read_price_per_million"] = 1
    with pytest.raises(ValidationError):
        _validate_profile(invalid)


def test_anthropic_system_prompt_has_explicit_one_hour_cache_breakpoint():
    blocks = _system_blocks("1h")

    assert len(blocks) == 1
    assert blocks[0]["cache_control"] == {"type": "ephemeral", "ttl": "1h"}
    assert blocks[0]["text"]


def test_anthropic_response_extracts_cache_and_reasoning_tokens():
    data = _response_data(
        {
            "id": "message-id",
            "model": "claude-sonnet-5",
            "stop_reason": "end_turn",
            "content": [
                {"type": "thinking", "thinking": ""},
                {"type": "text", "text": "die Haus"},
            ],
            "usage": {
                "input_tokens": 5,
                "cache_read_input_tokens": 100,
                "cache_creation_input_tokens": 10,
                "cache_creation": {
                    "ephemeral_5m_input_tokens": 0,
                    "ephemeral_1h_input_tokens": 10,
                },
                "output_tokens": 20,
                "output_tokens_details": {"thinking_tokens": 12},
            },
        }
    )

    assert data["content"] == "die Haus"
    assert data["tokens"] == {
        "input": 5,
        "cache_read_input": 100,
        "cache_creation_input": 10,
        "cache_creation_5m_input": 0,
        "cache_creation_1h_input": 10,
        "output": 20,
        "reasoning": 12,
        "total": 135,
    }


def test_anthropic_prewarm_matches_primary_thinking_configuration(monkeypatch):
    calls = []

    def fake_request(*args, **kwargs):
        calls.append(kwargs)
        return {
            "response_id": "prewarm",
            "returned_model": "claude-sonnet-5",
            "stop_reason": "max_tokens",
            "content": "",
            "tokens": _tokens(
                input=5,
                cache_read_input=0,
                cache_creation_input=100,
                cache_creation_1h_input=100,
                output=1,
                reasoning=1,
                total=106,
            ),
        }

    monkeypatch.setattr("alman.bench.anthropic_run._request", fake_request)

    _prewarm(object(), _profile())

    assert calls[0]["thinking"] == {"type": "adaptive", "display": "omitted"}
    assert calls[0]["effort"] == "xhigh"


def test_anthropic_forced_final_disables_thinking(monkeypatch):
    responses = iter(
        [
            {
                "response_id": "primary",
                "returned_model": "claude-sonnet-5",
                "stop_reason": "max_tokens",
                "content": "",
                "tokens": _tokens(output=4096, reasoning=4096, total=4201),
            },
            {
                "response_id": "fallback",
                "returned_model": "claude-sonnet-5",
                "stop_reason": "end_turn",
                "content": "die Haus",
                "tokens": _tokens(output=2, reasoning=0, total=107),
            },
        ]
    )
    calls = []

    def fake_request(*args, **kwargs):
        calls.append(kwargs)
        return next(responses)

    monkeypatch.setattr("alman.bench.anthropic_run._request", fake_request)

    class Item:
        id = "curated/example/0"
        source = "das Haus"
        accepted = ["die Haus"]
        paragraph = "example"

    sample = _run_sample(object(), _profile(), Item())

    assert sample["output"] == "die Haus"
    assert sample["correct"] is True
    assert sample["forced_final"] is True
    assert sample["tokens"]["reasoning"] == 4096
    assert calls[0]["thinking"] == {"type": "adaptive", "display": "omitted"}
    assert calls[0]["effort"] == "xhigh"
    assert calls[0]["max_tokens"] == 4096
    assert calls[1]["thinking"] == {"type": "disabled"}
    assert calls[1]["effort"] == "low"
    assert calls[1]["max_tokens"] == 512


def test_anthropic_aggregate_is_valid(tmp_path: Path):
    samples = [
        {
            "id": f"curated/example/{index}",
            "paragraph": "example",
            "correct": index < 24,
            "compliant": True,
            "thinking_observed": True,
            "forced_final": False,
            "cache_hit": True,
            "tokens": _tokens(),
            "primary_output_tokens": 20,
            "primary_reasoning_tokens": 12,
            "primary": {
                "response_id": f"response-{index}",
                "returned_model": "claude-sonnet-5",
                "stop_reason": "end_turn",
            },
            "fallback": None,
        }
        for index in range(48)
    ]
    prewarm = {
        "response_id": "prewarm",
        "returned_model": "claude-sonnet-5",
        "tokens": _tokens(
            input=5,
            cache_read_input=0,
            cache_creation_input=100,
            cache_creation_1h_input=100,
            output=1,
            reasoning=0,
            total=106,
        ),
    }
    result = _aggregate(
        profile=_profile(),
        samples=samples,
        prewarm=prewarm,
        started_at="2026-07-13T10:00:00+00:00",
        completed_at="2026-07-13T10:01:00+00:00",
        commit="a" * 40,
        artifact_path=tmp_path / "samples.jsonl",
    )

    assert result["results"]["acceptance"]["correct"] == 24
    assert result["cache"]["sample_cache_hit_count"] == 48
    assert result["results"]["tokens"]["cache_read_input"] == 4800
    assert result["results"]["estimated_cost_usd"] == pytest.approx(0.01146)
    validate_anthropic_result(result)

    invalid = copy.deepcopy(result)
    invalid["results"]["tokens"]["cache_creation_input"] = 1
    with pytest.raises(ValueError, match="cache creation"):
        validate_anthropic_result(invalid)

    invalid = copy.deepcopy(result)
    invalid["results"]["estimated_cost_usd"] = 1
    with pytest.raises(ValueError, match="estimated cost"):
        validate_anthropic_result(invalid)
