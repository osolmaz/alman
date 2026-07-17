// Locale metadata and UI strings for localized pages.
// Locale keys match the URL path segments configured in astro.config.mjs.

export type Locale = "en" | "de" | "al";

// BCP 47 language tags. Alman's tag is "de-AL" — the project petitions for
// this to be recognized officially and uses it as if it already were. In
// URLs we use the bare "al" prefix, because it is shorter and simpler.
export const langCodes: Record<Locale, string> = {
  en: "en",
  de: "de",
  al: "de-AL",
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  al: "Alman",
};

// Short codes for the compact switcher in the navbar.
export const localeShort: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  al: "AL",
};

// Order here is the display order of the navbar language switcher.
export const locales: Locale[] = ["en", "al", "de"];

/** Home page of a locale, the fallback target for untranslated pages. */
export const localeHome = (locale: Locale): string =>
  locale === "en" ? "/" : `/${locale}/`;

export const localePrefix = (locale: Locale): string =>
  locale === "en" ? "" : `/${locale}`;

/** Paths of a page that exists in all three language versions. */
export const translationsFor = (slug: string): Record<Locale, string> => ({
  en: `/${slug}/`,
  de: `/de/${slug}/`,
  al: `/al/${slug}/`,
});

export const ui: Record<Locale, Record<string, string>> = {
  en: {
    "nav.spec": "Specification",
    "nav.benchmark": "Benchmark",
    "nav.blog": "Blog",
    "nav.about": "About",
    "spec.title": "Specification",
    "spec.description": "The Alman specification: a simplified German dialect.",
    "spec.edit":
      "The Alman specification is open source and can be edited on",
    "blog.untranslated":
      "Note: This post is not yet available in English. The original version follows.",
  },
  de: {
    "nav.spec": "Spezifikation",
    "nav.benchmark": "Benchmark",
    "nav.blog": "Blog",
    "nav.about": "Über uns",
    "spec.title": "Spezifikation",
    "spec.description":
      "Die Alman-Spezifikation: ein vereinfachter deutscher Dialekt.",
    "spec.edit":
      "Die Alman-Spezifikation ist Open Source und kann bearbeitet werden auf",
    "blog.untranslated":
      "Hinweis: Dieser Beitrag liegt noch nicht auf Deutsch vor. Es folgt die englische Originalfassung.",
  },
  al: {
    "nav.spec": "Spezifikation",
    "nav.benchmark": "Benchmark",
    "nav.blog": "Blog",
    "nav.about": "Über uns",
    "spec.title": "Spezifikation",
    "spec.description":
      "Die Alman-Spezifikation: ein vereinfachte deutsche Dialekt.",
    "spec.edit":
      "Die Alman-Spezifikation ist Open Source und kann bearbeitet werden auf",
    "blog.untranslated":
      "Hinweis: Diese Beitrag liegt noch nicht auf Alman vor. Es folgt die englische Originalfassung.",
  },
};
