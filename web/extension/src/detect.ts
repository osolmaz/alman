import { browser } from "wxt/browser";
import type { LanguageDetector } from "@alman/core";

/**
 * Segment-level detector over the browser's built-in CLD
 * (browser.i18n.detectLanguage), available in content scripts. Anything the
 * detector is unsure about stays untranslated — the safe direction.
 */
export function cldDetector(): LanguageDetector {
  return async (text) => {
    const result = await browser.i18n.detectLanguage(text);
    const german = result.languages.find((entry) => entry.language === "de");
    if (!german) return { language: result.languages[0]?.language ?? "und", confidence: 0 };
    return { language: "de", confidence: (german.percentage ?? 0) / 100 };
  };
}

/** Page-level gate for auto-translate mode. */
export async function pageLooksGerman(): Promise<boolean> {
  const lang = document.documentElement.lang.toLowerCase();
  if (lang.startsWith("de")) return true;
  if (lang && !lang.startsWith("de")) return false;
  const sample = (document.body?.innerText ?? "").slice(0, 1500).trim();
  if (sample.length < 80) return false;
  const result = await browser.i18n.detectLanguage(sample);
  const german = result.languages.find((entry) => entry.language === "de");
  return Boolean(german && (german.percentage ?? 0) >= 75);
}
