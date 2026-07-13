# Agent instructions

- Never bump `documentVersion` or `lastUpdated` in `spec/main.json` (or version fields anywhere else) unless explicitly instructed to. Versioning is managed by the maintainer.
- The JSON files under `spec/` are the source of truth; `_includes/spec.md`, `_includes/spec.de.md`, and `_includes/spec.al.md` are generated from them. After editing any spec data file (including the `i18n` translation blocks), regenerate them with `uv run python -m alman.build` and commit the results alongside the data changes. Never edit the generated `_includes/spec*.md` files by hand.
- German (`de`) and Alman (`al`) spec translations live in `i18n` objects next to the English prose fields. Keep them faithful to the English text, and keep the `al` text compliant with the Alman grammar itself (quoted Standard German forms are mentions and are exempt).
