// Locale metadata and UI strings for localized pages.
// Locale keys match the URL path segments configured in astro.config.mjs.

export type Locale = "en" | "de" | "al";

// BCP 47 language tags. Alman has no ISO 639 code of its own yet: this
// project petitions for the official language tag "de-AL". Until that is
// granted, the markup uses the standards-compliant private-use tag
// "de-x-alman", so browsers, search engines, and screen readers treat the
// text as German. In URLs we use the bare "al" prefix regardless, because
// it is shorter and simpler.
export const langCodes: Record<Locale, string> = {
  en: "en",
  de: "de",
  al: "de-x-alman",
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

export const locales: Locale[] = ["en", "de", "al"];

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
      "Die Alman-Spezifikation ist Open Source und kann bearbeitet werden auf",
  },
  al: {
    "nav.spec": "Spezifikation",
    "nav.blog": "Blog",
    "nav.about": "Über uns",
    "spec.title": "Spezifikation",
    "spec.description":
      "Die Alman-Spezifikation: ein vereinfachte deutsche Dialekt.",
    "spec.edit":
      "Die Alman-Spezifikation ist Open Source und kann bearbeitet werden auf",
  },
};
