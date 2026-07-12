# Alman Design Guide

This guide defines the visual identity of alman.ai. It applies to the website, the specification pages, the benchmark leaderboard, and any printed or social material.

## Concept

Alman presents itself as an official language institution. The design plays this completely straight: the site should look like the web presence of a serious German public-sector body — sober, gridded, typographically strict. The humor of the project lives in the contrast between this institutional seriousness and the playfulness of the subject matter. The design itself never winks.

Two principles follow from this:

1. **Restraint carries the joke.** The more official the surroundings, the better the single playful element works. Allow at most one humorous element per page.
2. **Never imitate real state insignia.** The federal eagle, the federal color bar as used in government CI, and other official branding are protected and must not be copied. The identity references the *genre* of institutional design, not any actual institution.

## Emblem

The project emblem is a **heraldic potato**: a flat, single-color potato mark with symmetric leaf-wings, drawn in the visual language of classical state crests.

- Stark, geometric, vector-flat. No gradients, no outlines-within-outlines.
- **No face, no cartoon features.** The emblem is funny because it is treated with complete seriousness.
- Two treatments exist:
  - **Seal:** the emblem inside a circular ring with uppercase DIN-style text between thin rules. Used on the spec cover, the leaderboard ("geprüft" marks), and as a stamp graphic.
  - **Crest:** the bare emblem without ring text. Used in the site header, as favicon, and at small sizes.
- The emblem appears where a government site would place its crest: top-left of the header, on document covers, next to certification marks. It is never used as decoration or repeated as a pattern.

## Typography

| Role | Typeface | Notes |
|------|----------|-------|
| Headings, UI chrome, seal text | **D-DIN** (or Alte DIN 1451 Mittelschrift) | The signage-and-forms genre in one font. Uppercase for labels and stamps. |
| Body text, spec prose | **IBM Plex Sans** (or a quiet serif such as IBM Plex Serif for the spec document) | Sober and readable; the spec should feel like an official document. |
| Rule IDs, form numbers, scores, code | **IBM Plex Mono** | Everything that looks like data or a file reference. |

Typography rules:

- Headings in DIN, sentence case for titles, uppercase only for short labels ("AMTLICHE FASSUNG", "STAND: 2026-07-08").
- Body text at a comfortable reading size (16–18px), line length ≤ 75 characters.
- Section numbering (§1, §2a) is part of the identity — always visible, always in the heading.

## Color

| Token | Value | Use |
|-------|-------|-----|
| Paper | `#FAFAF8` | Page background |
| Ink | `#1A1A1A` | Text, rules, borders |
| Form blue | `#1F4E9B` | Accent: links, seal ink, active states, stamps |
| Grey 1 | `#6B6B6B` | Secondary text, metadata |
| Grey 2 | `#D9D9D6` | Table rules, dividers |
| Pass green | `#2E7D43` | Benchmark pass marks only |
| Fail red | `#B3261E` | Benchmark fail marks only |

Rules:

- One accent color per page. Form blue is the default; green/red appear only in result tables.
- No gradients, no drop shadows, no rounded corners beyond 2px.
- An optional thin black–red–gold hairline may be used as a *structural* border (e.g. under the header), never as decoration, and never in a way that imitates official government CI.

## Layout

- Visible structure: strict grid, generous whitespace, flat 1px rules between sections.
- Document metadata is a design element: version numbers, "Stand" dates, and document IDs (e.g. "Formblatt AL-1") appear in headers and footers in mono or DIN caps.
- Tables look like forms: ruled lines, tight cells, header rows in DIN caps.
- The spec page preserves § anchors and renders as one continuous official document with a sidebar table of contents.
- The benchmark leaderboard is styled as an official examination-results table: model, date ("geprüft am"), scores in mono, and a seal-derived pass/fail stamp.

## Tone of Voice

- Dry, precise, administrative. Short declarative sentences.
- German officialese pastiche is welcome in labels ("Amtliche Fassung", "Gültig ab"), used sparingly in body copy.
- The copy never explains the joke. No exclamation marks, no marketing superlatives, no emoji.

## Accessibility

- Maintain WCAG AA contrast (ink on paper and form blue on paper both pass).
- All meaning carried by color (pass/fail) is duplicated in text.
- Semantic heading hierarchy matches the visual § structure.
