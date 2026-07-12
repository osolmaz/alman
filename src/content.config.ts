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

export const collections = { blog, spec };
