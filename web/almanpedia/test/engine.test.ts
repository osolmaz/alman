// @vitest-environment happy-dom
import { createAlmanEngine, tinyldDetector, type TranslationClient } from "@alman/core";
import { expect, test } from "vitest";
import { germanWikipediaDetector } from "../src/engine";

test("Almanpedia routes proper-name-heavy Wikipedia prose as German", async () => {
  const sentence = "Anlass des Bruchs war eine Initiative des liberalen Premierministers William Gladstone, der im britischen Irland eine Selbstverwaltung (Home Rule) einrichten wollte.";

  const genericDetection = await tinyldDetector()(sentence);
  expect(genericDetection.language).toBe("de");
  expect(genericDetection.confidence).toBeLessThan(0.75);
  expect(await germanWikipediaDetector(sentence)).toEqual({ language: "de", confidence: 1 });

  const translatedInputs: string[] = [];
  const client: TranslationClient = {
    async init() { return { coldStartMs: 0 }; },
    async countTokens() { return 32; },
    async translate(texts) {
      translatedInputs.push(...texts);
      return ["übersetzt"];
    },
    async dispose() {},
  };
  const engine = createAlmanEngine({ client, detector: germanWikipediaDetector });
  expect(await engine.translateText(sentence)).toBe("übersetzt");
  expect(translatedInputs).toEqual([sentence]);
});
