// @ts-check
import { defineConfig } from "astro/config";
import { markdownConfig } from "./markdown.config.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://alman.ai",
  // The default HTML compression eats meaningful spaces before inline
  // elements (e.g. "edited on <a>GitHub</a>" rendered as "onGitHub").
  compressHTML: false,
  i18n: {
    defaultLocale: "en",
    // Alman has no ISO 639 code; per BCP 47 it is German with a
    // private-use subtag. The URL path uses the readable name.
    // Alman: petitioned official tag is "de-AL"; until granted, markup uses
    // the private-use tag "de-x-alman". The URL prefix is the shorter "al".
    locales: ["en", "de", { path: "al", codes: ["de-x-alman"] }],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: markdownConfig,
});
