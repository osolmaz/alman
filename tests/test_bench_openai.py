import copy
from pathlib import Path

import pytest
from jsonschema import ValidationError

from alman.bench.openai_run import (
    _aggregate,
    _response_data,
    _run_sample,
    _validate_profiles,
    validate_openai_result,
)


def _profile() -> dict:
    return {
        "name": "gpt-5.4-mini-xhigh",
        "model": "gpt-5.4-mini-2026-03-17",
        "label": "GPT-5.4 mini",
        "reasoning_effort": "xhigh",
        "forced_final_reasoning_effort": "none",
        "max_concurrency": 4,
        "input_price_per_million": 0.75,
        "cached_input_price_per_million": 0.075,
        "output_price_per_million": 4.5,
        "pricing_observed_at": "2026-07-12T10:00:00Z",
        "output": "result.json",
    }


def test_openai_profiles_are_strict():
    profile = _profile()
    _validate_profiles([profile])

    invalid = copy.deepcopy(profile)
    invalid["model"] = "gpt-5.6"
    with pytest.raises(ValidationError):
        _validate_profiles([invalid])

    invalid = copy.deepcopy(profile)
    invalid["cached_input_price_per_million"] = 1
    with pytest.raises(ValueError, match="cached input price"):
        _validate_profiles([invalid])


def test_openai_response_extracts_cache_and_reasoning_tokens():
    class Value:
        def __init__(self, **values):
            self.__dict__.update(values)

    response = Value(
        id="response-id",
        model="gpt-5.4-mini-2026-03-17",
        choices=[Value(finish_reason="stop", message=Value(content="die Haus"))],
        usage=Value(
            prompt_tokens=100,
            completion_tokens=20,
            total_tokens=120,
            prompt_tokens_details=Value(cached_tokens=80),
            completion_tokens_details=Value(reasoning_tokens=12),
        ),
    )

    data = _response_data(response)

    assert data["content"] == "die Haus"
    assert data["tokens"] == {
        "input": 100,
        "cached_input": 80,
        "output": 20,
        "reasoning": 12,
        "total": 120,
    }


def test_openai_forced_final_disables_reasoning(monkeypatch):
    responses = iter(
        [
            {
                "response_id": "primary",
                "returned_model": "model",
                "finish_reason": "length",
                "content": "",
                "tokens": {
                    "input": 10,
                    "cached_input": 0,
                    "output": 4096,
                    "reasoning": 4096,
                    "total": 4106,
                },
            },
            {
                "response_id": "fallback",
                "returned_model": "model",
                "finish_reason": "stop",
                "content": "die Haus",
                "tokens": {
                    "input": 12,
                    "cached_input": 10,
                    "output": 2,
                    "reasoning": 0,
                    "total": 14,
                },
            },
        ]
    )
    calls = []

    def fake_request(*args, **kwargs):
        calls.append(kwargs)
        return next(responses)

    monkeypatch.setattr("alman.bench.openai_run._request", fake_request)

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
    assert calls[0]["reasoning_effort"] == "xhigh"
    assert calls[0]["max_completion_tokens"] == 4096
    assert calls[1]["reasoning_effort"] == "none"
    assert calls[1]["max_completion_tokens"] == 512


def test_openai_aggregate_is_valid(tmp_path: Path):
    samples = [
        {
            "id": f"curated/example/{index}",
            "paragraph": "example",
            "correct": index < 24,
            "compliant": True,
            "thinking_observed": True,
            "forced_final": False,
            "tokens": {
                "input": 100,
                "cached_input": 80,
                "output": 20,
                "reasoning": 12,
                "total": 120,
            },
            "primary_completion_tokens": 20,
            "primary_reasoning_tokens": 12,
            "primary": {
                "response_id": f"response-{index}",
                "returned_model": "gpt-5.4-mini-2026-03-17",
                "finish_reason": "stop",
            },
            "fallback": None,
        }
        for index in range(48)
    ]
    result = _aggregate(
        profile=_profile(),
        samples=samples,
        started_at="2026-07-12T10:00:00+00:00",
        completed_at="2026-07-12T10:01:00+00:00",
        commit="a" * 40,
        artifact_path=tmp_path / "samples.jsonl",
    )

    assert result["results"]["acceptance"]["correct"] == 24
    assert result["results"]["tokens"]["cached_input"] == 3840
    assert result["results"]["estimated_cost_usd"] == pytest.approx(0.005328)
    validate_openai_result(result)

    invalid = copy.deepcopy(result)
    invalid["results"]["tokens"]["cached_input"] = 5000
    with pytest.raises(ValueError, match="cached input"):
        validate_openai_result(invalid)
