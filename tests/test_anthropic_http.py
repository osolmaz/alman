from inspect_ai.model import ChatMessageSystem, ChatMessageUser, GenerateConfig

from alman.bench.providers.anthropic_http import _model_output, _request_payload


def test_request_caches_only_the_shared_system_prefix() -> None:
    request = _request_payload(
        "claude-fable-5",
        [
            ChatMessageSystem(content="shared spec"),
            ChatMessageUser(content="case-specific sentence"),
        ],
        GenerateConfig(max_tokens=32768, reasoning_effort="high"),
    )

    assert request["system"] == [
        {
            "type": "text",
            "text": "shared spec",
            "cache_control": {"type": "ephemeral", "ttl": "5m"},
        }
    ]
    assert request["messages"] == [
        {
            "role": "user",
            "content": [{"type": "text", "text": "case-specific sentence"}],
        }
    ]
    assert request["output_config"] == {"effort": "high"}
    assert "thinking" not in request


def test_response_preserves_reasoning_and_cache_usage() -> None:
    output = _model_output(
        {
            "id": "msg_test",
            "model": "claude-fable-5",
            "stop_reason": "end_turn",
            "content": [
                {"type": "thinking", "thinking": "reason", "signature": "sig"},
                {"type": "text", "text": "answer"},
            ],
            "usage": {
                "input_tokens": 4,
                "cache_creation_input_tokens": 20,
                "cache_read_input_tokens": 30,
                "output_tokens": 6,
                "output_tokens_details": {"thinking_tokens": 2},
            },
        },
        "claude-fable-5",
    )

    assert output.completion == "answer"
    assert output.stop_reason == "stop"
    assert output.usage is not None
    assert output.usage.input_tokens == 4
    assert output.usage.input_tokens_cache_write == 20
    assert output.usage.input_tokens_cache_read == 30
    assert output.usage.reasoning_tokens == 2
    assert output.usage.total_tokens == 60
