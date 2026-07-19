"""The model registry for standardized almanbench runs.

``alman/bench/models.yaml`` pins everything needed to reproduce a run for a
named profile: the Inspect model string, provider environment, generation
config, concurrency, and observed pricing. The runner (``alman.bench.run``)
resolves a profile here and hands execution to Inspect.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

REGISTRY_PATH = Path(__file__).with_name("models.yaml")

_ENV_REF = re.compile(r"^\$\{([A-Z0-9_]+)\}$")


@dataclass(frozen=True)
class Profile:
    """One reproducible model configuration."""

    name: str
    label: str
    platform: str
    model: str
    env: dict[str, str] = field(default_factory=dict)
    model_args: dict[str, Any] = field(default_factory=dict)
    generate: dict[str, Any] = field(default_factory=dict)
    max_connections: int = 8
    pricing: dict[str, Any] | None = None

    @property
    def requested_model(self) -> str:
        """The provider-facing model name, without Inspect routing prefixes."""
        parts = self.model.split("/")
        skip = 2 if parts[0] == "openai-api" else 1
        return "/".join(parts[skip:])

    def resolved_env(self) -> dict[str, str]:
        """The profile environment with ``${VAR}`` references expanded."""
        resolved = {}
        for key, value in self.env.items():
            match = _ENV_REF.match(value)
            if match:
                source = match.group(1)
                if source not in os.environ:
                    raise KeyError(
                        f"profile {self.name!r} needs ${source} in the environment"
                    )
                value = os.environ[source]
            resolved[key] = value
        return resolved


def load_registry(path: Path = REGISTRY_PATH) -> dict[str, Profile]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    defaults = data.get("defaults", {})
    profiles = {}
    for name, entry in data["profiles"].items():
        merged = {**defaults, **entry}
        pricing = merged.get("pricing")
        if pricing and "observed" in pricing:
            # YAML parses unquoted dates as datetime.date; keep it a string
            # so pricing serializes into the JSON artifacts.
            pricing = {**pricing, "observed": str(pricing["observed"])}
        profiles[name] = Profile(
            name=name,
            label=merged["label"],
            platform=merged["platform"],
            model=merged["model"],
            env=merged.get("env", {}),
            model_args=merged.get("model_args", {}),
            generate=merged.get("generate", {}),
            max_connections=merged.get("max_connections", 8),
            pricing=pricing,
        )
    return profiles


def load_profile(name: str, path: Path = REGISTRY_PATH) -> Profile:
    profiles = load_registry(path)
    if name not in profiles:
        known = ", ".join(sorted(profiles))
        raise KeyError(f"unknown profile {name!r}; registry has: {known}")
    return profiles[name]
