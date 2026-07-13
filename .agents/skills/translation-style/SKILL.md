---
name: translation-style
description: Translation style guide for German (de) and Alman (al) content in the Alman repo. Use when translating, reviewing, or editing any German or Alman text — site pages, spec i18n blocks, UI strings, or examples.
---

# Translation style

Principles for all German (`de`) and Alman (`al`) text in this project: the
spec `i18n` blocks, the About page, UI strings, and any future localized
content.

## No language purism

This project does not pursue language purism. We are not the Goethe-Institut.

- Write the German that is actually used in practice — contemporary German as
  found in real tech writing, product copy, and everyday usage — not textbook
  or "Reindeutsch" purist German.
- Avoid purist coinages when a loanword or anglicism is the established term.
  This applies especially to technical vocabulary.

| Prefer (used in practice) | Avoid (purist) |
|---------------------------|----------------|
| Open Source | quelloffen |
| Website | Netzauftritt, Internetpräsenz |
| Repository | Quellcodeverwaltung (as a translation of "repo") |
| Benchmark | Vergleichstest, Leistungsvergleich |
| Feature | Funktionalitätsmerkmal |
| Link | Verknüpfung, Verweis |
| E-Mail | elektronische Post |

- The test: what would a German developer or a mainstream German tech
  publication write today? If Duden lists the anglicism and real usage prefers
  it, use it.
- This is not a license for Denglisch. Where the native word is the normal
  everyday term (*herunterladen*, *Anwendung*, *Einstellungen* in UI contexts),
  use it. Follow practice, not ideology, in either direction.

## Fidelity

- Translate the English source faithfully: same content, same structure, no
  additions, omissions, or editorializing.
- Keep the `de` and `al` versions structurally parallel to each other. The
  Alman About page renders a word-level diff against the German one, so
  divergence beyond the grammar differences breaks the diff.

## Alman grammar compliance

- Only the `al` text uses Alman grammar; the `de` text is Standard German.
- The `al` text must comply with the Alman spec itself: invariant **die**/**ein**,
  genitive **der** (or **von die**), invariant **-e** adjective endings, resolved
  preposition-article contractions, relativizer **das** (with **die** accepted),
  singular **sie** for generic persons.
- Quoted Standard German forms (e.g. *der/die/das* cited as examples) are
  mentions, not uses — they stay as-is and are exempt from linting.
- After editing spec `i18n` blocks, regenerate the documents with
  `uv run python -m alman.build`. Validate Alman site content with
  `uv run pytest tests/test_site_content.py`.
