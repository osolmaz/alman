# Agent instructions

- Never bump `documentVersion` or `lastUpdated` in `spec/main.json` (or version fields anywhere else) unless explicitly instructed to. Versioning is managed by the maintainer.
- The JSON files under `spec/` are the source of truth; `_includes/spec.md`, `_includes/spec.de.md`, and `_includes/spec.al.md` are generated from them. After editing any spec data file (including the `i18n` translation blocks), regenerate them with `uv run python -m alman.build` and commit the results alongside the data changes. Never edit the generated `_includes/spec*.md` files by hand.
- German (`de`) and Alman (`al`) spec translations live in `i18n` objects next to the English prose fields. Keep them faithful to the English text, and keep the `al` text compliant with the Alman grammar itself (quoted Standard German forms are mentions and are exempt).
- Alman's language code is `al` (URL prefix `/al/`, internal locale key, spec i18n key). The BCP 47 tag is `de-AL` — petitioned as official and used in markup as if already granted. Do not use private-use tags like `de-x-alman`.

## Writing style

- Avoid em dashes in prose written for this project (blog posts, site copy, documentation). Heavy em-dash use is a tell for AI writing. At most one set of em dashes per 1000 words. Restructure with commas, parentheses, or separate sentences instead.
- Do not compensate by overusing colons or semicolons the same way. "X: Y" constructions used for punchiness ("Alman is our answer: a simplified...") are the same AI tell. Colons are for genuine lists only; semicolons should be rare. Do not try to make prose sound edgy through punctuation. Write plain sentences.
- Never mention or describe the subject of the emblem in any published or user-facing text (site copy, blog posts, alt text, social copy). It is an obvious visual joke that must never be acknowledged verbally. Call it "the seal" or "the emblem" if a reference is unavoidable. Internal design documentation is the only exception.

## Translation style

- No language purism. When translating into German or Alman, use the terms actually used in practice, especially for technical vocabulary — e.g. **Open Source**, not *quelloffen*. Avoid purist "Reindeutsch" coinages; we are not the Goethe-Institut. The test: what would a German developer or a mainstream German tech publication write today?
- Translations must stay faithful to the English source, and the `de`/`al` versions must stay structurally parallel to each other.
- The full style guide is the `translation-style` skill in `.agents/skills/translation-style/SKILL.md`. Follow it for any German or Alman text in this repo.

## Language design perspective

- Alman's guiding heuristic is that English is the experiment that already ran: a Germanic language that actually lost grammatical gender and case during the Middle English period. Its outcome demonstrates the path of least resistance for such a simplification, and because English is the world's most common second language, its patterns are the attractor that would shape German if it ever tipped the same way.
- When a design question in the spec has several defensible answers, prefer the one that matches the English outcome, cognate-for-cognate where possible (e.g. invariant article **die** ↔ *the*, relativizer/demonstrative **das** ↔ *that*, singular **sie** ↔ singular *they*).
- The fuller rationale, with the relativizer rule as a worked case study, is in `docs/language-design-notes.md`. Read it before proposing or evaluating rule changes. The `docs/` directory is internal maintainer material and is not published on the site.
