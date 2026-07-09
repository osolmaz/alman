# Agent instructions

- Never bump `documentVersion` or `lastUpdated` in `spec/main.json` (or version fields anywhere else) unless explicitly instructed to. Versioning is managed by the maintainer.
- The JSON files under `spec/` are the source of truth; `_includes/spec.md` is generated from them. After editing any spec data file, regenerate it with `uv run python -m alman.build` and commit the result alongside the data changes. Never edit `_includes/spec.md` by hand.
