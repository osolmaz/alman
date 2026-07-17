"""Minimal Anthropic Messages API adapter using the existing HTTP client.

The benchmark only needs text conversations, adaptive reasoning, and accurate
usage reporting. Keeping that protocol boundary here avoids adding an SDK for
each provider while still preserving Inspect's concurrency, retry, and logging
behavior.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from inspect_ai.model import (
    ChatCompletionChoice,
    ChatMessage,
    ChatMessageAssistant,
    ChatMessageSystem,
    ChatMessageTool,
    ContentReasoning,
    ContentText,
    GenerateConfig,
    ModelAPI,
    ModelOutput,
    ModelUsage,
    RetryDecision,
    StopReason,
    modelapi,
)
from inspect_ai.tool import ToolChoice, ToolInfo

ANTHROPIC_API_KEY = "ANTHROPIC_API_KEY"
ANTHROPIC_BASE_URL = "ANTHROPIC_BASE_URL"
ANTHROPIC_VERSION = "2023-06-01"


@modelapi(name="anthropic-http")
class AnthropicHTTPAPI(ModelAPI):
    """Call Anthropic directly without depending on its Python SDK."""

    def __init__(
        self,
        model_name: str,
        base_url: str | None = None,
        api_key: str | None = None,
        config: GenerateConfig = GenerateConfig(),
        **model_args: Any,
    ) -> None:
        resolved_key = api_key or os.environ.get(ANTHROPIC_API_KEY)
        if not resolved_key:
            raise RuntimeError(f"{ANTHROPIC_API_KEY} environment variable not set")
        resolved_url = base_url or os.environ.get(
            ANTHROPIC_BASE_URL, "https://api.anthropic.com"
        )
        super().__init__(
            model_name=model_name,
            base_url=resolved_url.rstrip("/"),
            api_key=resolved_key,
            api_key_vars=[ANTHROPIC_API_KEY],
            config=config,
        )
        self.model_args = model_args
        self.client = httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=30.0))

    async def aclose(self) -> None:
        await self.client.aclose()

    async def generate(
        self,
        input: list[ChatMessage],
        tools: list[ToolInfo],
        tool_choice: ToolChoice,
        config: GenerateConfig,
    ) -> ModelOutput:
        if tools:
            raise NotImplementedError(
                "anthropic-http currently supports text-only benchmark requests"
            )

        request = _request_payload(self.model_name, input, config, self.model_args)
        response = await self.client.post(
            f"{self.base_url}/v1/messages",
            headers={
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
                "x-api-key": str(self.api_key),
            },
            json=request,
        )
        if response.is_error:
            detail = _error_detail(response)
            raise httpx.HTTPStatusError(
                f"Anthropic HTTP {response.status_code}: {detail}",
                request=response.request,
                response=response,
            )
        return _model_output(response.json(), self.model_name)

    def should_retry(self, ex: Exception) -> bool | RetryDecision:
        if isinstance(ex, httpx.HTTPStatusError):
            status = ex.response.status_code
            retry_after = _retry_after(ex.response)
            if status == 429:
                return RetryDecision.rate_limit(retry_after)
            if status in {408, 409} or status >= 500:
                return RetryDecision.transient(retry_after)
            return RetryDecision.no()
        if isinstance(ex, (httpx.TimeoutException, httpx.NetworkError)):
            return RetryDecision.transient()
        return RetryDecision.no()

    def is_auth_failure(self, ex: Exception) -> bool:
        return isinstance(ex, httpx.HTTPStatusError) and ex.response.status_code in {
            401,
            403,
        }

    def connection_key(self) -> str:
        return f"{self.initial_api_key}:{self.model_name}"


def _request_payload(
    model_name: str,
    messages: list[ChatMessage],
    config: GenerateConfig,
    model_args: dict[str, Any] | None = None,
) -> dict[str, Any]:
    system: list[dict[str, Any]] = []
    conversation: list[dict[str, Any]] = []
    for message in messages:
        blocks = _message_blocks(message)
        if isinstance(message, ChatMessageSystem):
            system.extend(blocks)
        elif isinstance(message, ChatMessageTool):
            raise NotImplementedError("anthropic-http does not support tool results")
        else:
            conversation.append({"role": message.role, "content": blocks})

    # Only the shared system prefix is cached. Marking the case-specific user
    # block would create 1,025 distinct entries and destroy cross-row reuse.
    if system:
        system[-1] = {
            **system[-1],
            "cache_control": {"type": "ephemeral", "ttl": "5m"},
        }

    request: dict[str, Any] = {
        **(model_args or {}),
        "model": model_name,
        "max_tokens": config.max_tokens or 4096,
        "messages": conversation,
    }
    if system:
        request["system"] = system
    if config.temperature is not None:
        request["temperature"] = config.temperature
    if config.top_p is not None:
        request["top_p"] = config.top_p
    if config.top_k is not None:
        request["top_k"] = config.top_k
    if config.stop_seqs:
        request["stop_sequences"] = config.stop_seqs
    if config.reasoning_effort is not None:
        # Fable's adaptive thinking is always on. For the benchmark's rare
        # forced-final recovery, Inspect uses "none"; low is the closest valid
        # Fable effort and keeps that recovery concise.
        effort = "low" if config.reasoning_effort == "none" else config.reasoning_effort
        request["output_config"] = {"effort": effort}
    return request


def _message_blocks(message: ChatMessage) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    for content in message.content_list:
        if isinstance(content, ContentText):
            blocks.append({"type": "text", "text": content.text})
        elif isinstance(content, ContentReasoning):
            if isinstance(content.internal, dict):
                blocks.append(dict(content.internal))
            elif content.redacted:
                blocks.append(
                    {"type": "redacted_thinking", "data": content.summary or ""}
                )
            else:
                blocks.append(
                    {
                        "type": "thinking",
                        "thinking": content.reasoning,
                        "signature": content.signature or "",
                    }
                )
        else:
            raise NotImplementedError(
                f"anthropic-http does not support {content.type!r} content"
            )
    return blocks


def _model_output(response: dict[str, Any], requested_model: str) -> ModelOutput:
    content = []
    for block in response.get("content", []):
        block_type = block.get("type")
        if block_type == "text":
            content.append(ContentText(text=block.get("text", "")))
        elif block_type == "thinking":
            content.append(
                ContentReasoning(
                    reasoning=block.get("thinking", ""),
                    signature=block.get("signature"),
                    internal=block,
                )
            )
        elif block_type == "redacted_thinking":
            content.append(
                ContentReasoning(
                    reasoning="",
                    summary="",
                    redacted=True,
                    internal=block,
                )
            )

    usage_data = response.get("usage", {})
    cache_write = usage_data.get("cache_creation_input_tokens")
    cache_read = usage_data.get("cache_read_input_tokens")
    input_tokens = usage_data.get("input_tokens", 0)
    output_tokens = usage_data.get("output_tokens", 0)
    reasoning_tokens = usage_data.get("output_tokens_details", {}).get(
        "thinking_tokens"
    )
    usage = ModelUsage(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=input_tokens
        + (cache_write or 0)
        + (cache_read or 0)
        + output_tokens,
        input_tokens_cache_write=cache_write,
        input_tokens_cache_read=cache_read,
        reasoning_tokens=reasoning_tokens,
    )
    return ModelOutput(
        model=response.get("model", requested_model),
        choices=[
            ChatCompletionChoice(
                message=ChatMessageAssistant(
                    content=content,
                    model=response.get("model", requested_model),
                    source="generate",
                ),
                stop_reason=_stop_reason(response.get("stop_reason")),
            )
        ],
        usage=usage,
        metadata={
            "anthropic_message_id": response.get("id"),
            "stop_sequence": response.get("stop_sequence"),
        },
    )


def _stop_reason(value: str | None) -> StopReason:
    if value in {"end_turn", "stop_sequence"}:
        return "stop"
    if value == "max_tokens":
        return "max_tokens"
    if value == "refusal":
        return "content_filter"
    return "unknown"


def _error_detail(response: httpx.Response) -> str:
    try:
        error = response.json().get("error", {})
        return f"{error.get('type', 'error')}: {error.get('message', response.text)}"
    except ValueError:
        return response.text[:1000]


def _retry_after(response: httpx.Response) -> float | None:
    value = response.headers.get("retry-after")
    if value is None:
        return None
    try:
        return float(value)
    except ValueError:
        return None
