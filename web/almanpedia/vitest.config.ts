import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "almanpedia",
    include: ["test/**/*.test.ts"],
    // jsdom, not happy-dom: DOMPurify must run supported (sanitize.ts hard-fails otherwise).
    environment: "jsdom",
  },
});
