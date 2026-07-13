# Agent instructions

- Never bump `documentVersion` or `lastUpdated` in `spec/main.json` (or version fields anywhere else) unless explicitly instructed to. Versioning is managed by the maintainer.
- The JSON files under `spec/` are the source of truth; `_includes/spec.md`, `_includes/spec.de.md`, and `_includes/spec.al.md` are generated from them. After editing any spec data file (including the `i18n` translation blocks), regenerate them with `uv run python -m alman.build` and commit the results alongside the data changes. Never edit the generated `_includes/spec*.md` files by hand.
- German (`de`) and Alman (`al`) spec translations live in `i18n` objects next to the English prose fields. Keep them faithful to the English text, and keep the `al` text compliant with the Alman grammar itself (quoted Standard German forms are mentions and are exempt).

## Language design perspective

- Alman's guiding heuristic is that English is the experiment that already ran: a Germanic language that actually lost grammatical gender and case during the Middle English period. Its outcome demonstrates the path of least resistance for such a simplification, and because English is the world's most common second language, its patterns are the attractor that would shape German if it ever tipped the same way.
- When a design question in the spec has several defensible answers, prefer the one that matches the English outcome, cognate-for-cognate where possible (e.g. invariant article **die** ↔ *the*, relativizer/demonstrative **das** ↔ *that*, singular **sie** ↔ singular *they*).
- The fuller rationale, with the relativizer rule as a worked case study, is in `docs/language-design-notes.md`. Read it before proposing or evaluating rule changes. The `docs/` directory is internal maintainer material and is not published on the site.
