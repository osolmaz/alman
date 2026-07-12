// @ts-check
import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import remarkSmartypants from "remark-smartypants";
import rehypeKatex from "rehype-katex";
import { remarkHeadingId } from "remark-custom-heading-id";

// https://astro.build/config
export default defineConfig({
  site: "https://alman.ai",
  // The default HTML compression eats meaningful spaces before inline
  // elements (e.g. "edited on <a>GitHub</a>" rendered as "onGitHub").
  compressHTML: false,
  markdown: {
    // remarkHeadingId handles the kramdown-style `{#id}` heading anchors
    // used by the generated spec document (_includes/spec.md).
    // "oldschool" dashes match kramdown: -- becomes en dash, --- em dash.
    remarkPlugins: [
      remarkMath,
      remarkHeadingId,
      [remarkSmartypants, { dashes: "oldschool" }],
    ],
    rehypePlugins: [rehypeKatex],
  },
});
