// Locale metadata and UI strings for localized pages.
// Locale keys match the URL path segments configured in astro.config.mjs.

export type Locale = "en" | "de" | "alman";

// BCP 47 language tags. Alman has no ISO 639 code of its own; it is
// tagged as German with a private-use subtag, so browsers, search
// engines, and screen readers treat it as German.
export const langCodes: Record<Locale, string> = {
  en: "en",
  de: "de",
  alman: "de-x-alman",
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  alman: "Alman",
};

// Short codes for the compact switcher in the navbar.
export const localeShort: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  alman: "AL",
};

export const locales: Locale[] = ["en", "de", "alman"];

/** Home page of a locale, the fallback target for untranslated pages. */
export const localeHome = (locale: Locale): string =>
  locale === "en" ? "/" : `/${locale}/`;

export const localePrefix = (locale: Locale): string =>
  locale === "en" ? "" : `/${locale}`;

/** Paths of a page that exists in all three language versions. */
export const translationsFor = (slug: string): Record<Locale, string> => ({
  en: `/${slug}/`,
  de: `/de/${slug}/`,
  alman: `/alman/${slug}/`,
});

export const ui: Record<Locale, Record<string, string>> = {
  en: {
    "nav.spec": "Specification",
    "nav.blog": "Blog",
    "nav.about": "About",
    "spec.title": "Specification",
    "spec.description": "The Alman specification: a simplified German dialect.",
    "spec.edit":
      "The Alman specification is open source and can be edited on",
  },
  de: {
    "nav.spec": "Spezifikation",
    "nav.blog": "Blog",
    "nav.about": "Über uns",
    "spec.title": "Spezifikation",
    "spec.description":
      "Die Alman-Spezifikation: ein vereinfachter deutscher Dialekt.",
    "spec.edit":
      "Die Alman-Spezifikation ist quelloffen und kann bearbeitet werden auf",
  },
  alman: {
    "nav.spec": "Spezifikation",
    "nav.blog": "Blog",
    "nav.about": "Über uns",
    "spec.title": "Spezifikation",
    "spec.description":
      "Die Alman-Spezifikation: ein vereinfachte deutsche Dialekt.",
    "spec.edit":
      "Die Alman-Spezifikation ist quelloffen und kann bearbeitet werden auf",
  },
};
