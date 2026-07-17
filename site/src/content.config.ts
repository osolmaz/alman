import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog posts. English posts live at <slug>.md; translations, where they
// exist, live alongside them at <slug>.de.md and <slug>.al.md. The ids
// keep the locale suffix ("<slug>.de"), so translations are addressable
// and excluded from the English post listing.
const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: "**/*.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
  }),
});

// The specification documents are generated from the JSON files under spec/
// by `uv run python -m alman.build` and committed at spec/generated/spec.md
// (English), spec.de.md (German), and spec.al.md (Alman). They are loaded
// from there as-is; do not edit them by hand.
const spec = defineCollection({
  loader: glob({
    base: "../spec/generated",
    pattern: "spec*.md",
    // Keep the file name (minus extension) as the id, so the localized
    // documents are addressable as "spec", "spec.de", and "spec.al".
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
});

// The About page, one entry per locale (en.md, de.md, al.md).
// The German and Alman entries are faithful translations of the English
// text and must stay structurally parallel: the Alman page renders a
// word-level diff against the German entry.
const about = defineCollection({
  loader: glob({ base: "./src/content/about", pattern: "*.md" }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { blog, spec, about };
