import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
  }),
});

// The specification document is generated from the JSON files under spec/
// by `uv run python -m alman.build` and committed at _includes/spec.md.
// It is loaded from there as-is; do not edit it by hand.
const spec = defineCollection({
  loader: glob({ base: "./_includes", pattern: "spec.md" }),
});

// The About page, one entry per locale (en.md, de.md, alman.md).
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
