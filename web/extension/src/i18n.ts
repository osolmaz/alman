import { browser } from "wxt/browser";
import type { Settings } from "./settings";

const STRINGS = {
  en: {
    title: "ALMAN TRANSLATOR",
    subtitle: "German → Alman, locally in your browser",
    translate: "Translate this page",
    showOriginal: "Show original",
    showAlman: "Show Alman",
    autoTranslate: "Translate German pages automatically",
    siteRule: "This site",
    siteDefault: "Default",
    siteAlways: "Always translate",
    siteNever: "Never translate",
    modelEmpty: "Model not loaded yet (34 MB download on first use)",
    modelDownloading: "Downloading model",
    modelPreparing: "Preparing model …",
    modelReady: "Model ready",
    pageTranslating: "Translating",
    pageDone: "Page translated",
    notInjected: "Not active on this page",
    noAccess: "This page cannot be translated",
  },
  de: {
    title: "ALMAN ÜBERSETZER",
    subtitle: "Deutsch → Alman, lokal im Browser",
    translate: "Diese Seite übersetzen",
    showOriginal: "Original anzeigen",
    showAlman: "Alman anzeigen",
    autoTranslate: "Deutsche Seiten automatisch übersetzen",
    siteRule: "Diese Website",
    siteDefault: "Standard",
    siteAlways: "Immer übersetzen",
    siteNever: "Nie übersetzen",
    modelEmpty: "Modell noch nicht geladen (34 MB, einmalig)",
    modelDownloading: "Modell wird geladen",
    modelPreparing: "Modell wird vorbereitet …",
    modelReady: "Modell bereit",
    pageTranslating: "Übersetzung läuft",
    pageDone: "Seite übersetzt",
    notInjected: "Auf dieser Seite nicht aktiv",
    noAccess: "Diese Seite kann nicht übersetzt werden",
  },
  al: {
    title: "ALMAN ÜBERSETZER",
    subtitle: "Deutsch → Alman, lokal in die Browser",
    translate: "Diese Seite übersetzen",
    showOriginal: "Original anzeigen",
    showAlman: "Alman anzeigen",
    autoTranslate: "Deutsche Seiten automatisch übersetzen",
    siteRule: "Diese Website",
    siteDefault: "Standard",
    siteAlways: "Immer übersetzen",
    siteNever: "Nie übersetzen",
    modelEmpty: "Modell noch nicht geladen (34 MB, einmalig)",
    modelDownloading: "Modell wird geladen",
    modelPreparing: "Modell wird vorbereitet …",
    modelReady: "Modell bereit",
    pageTranslating: "Übersetzung läuft",
    pageDone: "Seite übersetzt",
    notInjected: "Auf diese Seite nicht aktiv",
    noAccess: "Diese Seite kann nicht übersetzt werden",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

export function resolveLocale(setting: Settings["uiLanguage"]): "en" | "de" | "al" {
  if (setting !== "auto") return setting;
  return browser.i18n.getUILanguage().toLowerCase().startsWith("de") ? "de" : "en";
}

export function t(locale: "en" | "de" | "al", key: StringKey): string {
  return STRINGS[locale][key];
}
