import { detectAll } from "tinyld/light";

/**
 * Detection result shape accepted by the safe translator. Mirrors the frozen
 * engine's duck typing: `language`/`lang` and `confidence`/`accuracy` are
 * interchangeable, so tinyld results (`{lang, accuracy}`) and
 * `chrome.i18n.detectLanguage` adapters both fit without mapping layers.
 */
export interface Detection {
  language?: string;
  lang?: string;
  confidence?: number;
  accuracy?: number;
}

export type LanguageDetector = (text: string) => Detection | Promise<Detection>;

/** Bundled detector for contexts without a platform detector (almanpedia). */
export function tinyldDetector(): LanguageDetector {
  return (text) => {
    const [best] = detectAll(text);
    return best ? { language: best.lang, confidence: best.accuracy } : { language: "und", confidence: 0 };
  };
}

/** Constant detector for tests and known-language content. */
export function fixedDetector(detection: Detection): LanguageDetector {
  return () => detection;
}
