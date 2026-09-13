/**
 * The two languages Almanpedia's own interface is written in.
 *
 * What switches: the shell, the landing page, the staged figure's narration and
 * controls, and the reader's chrome. What does not: the German article text, the
 * example words the figure turns over, the forms quoted inside an explanation,
 * and the §-references. The page shows German material and explains it in the
 * reader's language, so an English visitor can follow the rules without the demo
 * turning into a translation of itself.
 *
 * English is a second locale of one interface, not a second site: no path prefix
 * and no parallel pages, so a locale is state that lives beside the route. It
 * travels in `?lang=` while it is a choice someone can share, and in local
 * storage once it is a preference.
 *
 * The German table is the source of truth for the shape. `Messages` is derived
 * from it, so an English entry that is missing, renamed or misspelled does not
 * compile, and every key used at a call site is checked against it.
 */

import type { TextPart } from "./ui/dom";

export type Locale = "de" | "en";

export const LOCALES: readonly Locale[] = ["de", "en"];
export const DEFAULT_LOCALE: Locale = "de";
export const LOCALE_STORAGE_KEY = "almanpedia:locale:v1";
export const LOCALE_QUERY_KEY = "lang";

/** A caption the figure narrates itself with. */
export type CaptionKey =
  | "readWikipedia"
  | "modelDownload"
  | "ready"
  | "articleFromWikipedia"
  | "markWiki"
  | "typeAlman"
  | "alias"
  | "sameArticle"
  | "stillStandard"
  | "lineByLine"
  | "shake"
  | "onePass"
  | "done"
  | "fiveForms"
  | "oneFormLeft"
  | "genitiveException"
  | "threeGenders"
  | "threePhrases"
  | "nounUnchanged"
  | "endingsRules"
  | "oneRuleSet"
  | "everyArticle";

const deMessages = {
  htmlLang: "de",
  documentTitle: "Almanpedia — Die freie Enzyklopädie, vereinfacht",
  documentDescription:
    "Almanpedia übersetzt Artikel der deutschsprachigen Wikipedia in Alman, einen konstruierten Dialekt "
    + "des Deutschen ohne grammatisches Geschlecht. Die Übersetzung läuft vollständig im Browser.",
  brandWordmarkAlt: "ALMANPEDIA – Die freie Enzyklopädie, vereinfacht",

  search: {
    placeholder: "Artikel suchen …",
    label: "Artikel suchen",
  },

  /** The language switch itself: its group label and the two language names. */
  language: {
    label: "Sprache",
    de: "Deutsch",
    en: "Englisch",
  },

  /** The site footer, as runs of text with the links that sit inside them. */
  footer: [
    "Inhalte aus der ",
    { href: "https://de.wikipedia.org", text: "deutschsprachigen Wikipedia", external: true },
    ", Text lizenziert unter ",
    { href: "https://creativecommons.org/licenses/by-sa/4.0/deed.de", text: "CC BY-SA 4.0", external: true },
    ". Übersetzung nach ",
    { href: "https://alman.ai", text: "Alman", external: true },
    " durch ",
    { href: "https://huggingface.co/osolmaz/GoePT-1-20M", text: "GoePT-1-20M", external: true },
    ", lokal im Browser. Ein Projekt von alman.ai.",
  ] satisfies TextPart[],

  progress: {
    loadingModel: (percent: number) => `MODELL WIRD GELADEN: ${percent} %`,
    preparingModel: "MODELL WIRD VORBEREITET …",
    translatingMainPage: (percent: number) => `HAUPTSEITE WIRD ÜBERSETZT: ${percent} %`,
    translatingArticle: (percent: number) => `ARTIKEL WIRD ÜBERSETZT: ${percent} %`,
    preparingTranslation: "ÜBERSETZUNG WIRD VORBEREITET …",
    loadingArticle: (title: string) => `„${title}“ WIRD GELADEN …`,
  },

  contents: {
    heading: "Inhalt",
    label: "Inhaltsverzeichnis",
    section: (index: number) => `Abschnitt ${index}`,
  },

  settings: {
    panelTitle: "Erscheinungsbild",
    textGroup: "Text",
    textSmall: "Klein",
    textStandard: "Standard",
    textLarge: "Groß",
    colorGroup: "Farbe",
    colorAuto: "Automatisch",
    colorLight: "Hell",
    colorDark: "Dunkel",
    translationGroup: "Übersetzung",
    translationWave: "Leuchteffekt beim Übersetzen",
    changeEffects: "Geänderte Wörter animieren",
    note: "Die Auswahl wird in diesem Browser gespeichert.",
    close: "Verbergen",
  },

  reader: {
    /** The three views above an article, and the reason they are a group. */
    viewLabel: "Ansicht",
    tabAlman: "Alman",
    tabOriginal: "Original",
    tabChanges: "Änderungen",
    differenceRemoved: "Durchgestrichen: deutsches Original.",
    differenceAdded: "Blau: Alman-Fassung.",
    translationUnavailableArticle: "Übersetzung nicht verfügbar — Original wird angezeigt.",
    translationUnavailableMainPage: "Übersetzung nicht verfügbar. Die deutschsprachige Hauptseite bleibt sichtbar.",
    slowLoad: "Das Laden dauert länger als üblich.",
    retry: "Erneut versuchen",
    openOriginal: "Original bei Wikipedia öffnen",
    notFoundTag: "BESCHEID AP-404",
    failureTag: "STÖRUNGSMELDUNG",
    notFoundHeading: "Artikel nicht vorhanden",
    notFoundBody: (title: string) => `Ein Artikel mit der Bezeichnung „${title}“ ist nicht verzeichnet.`,
    notFoundSearch: "In der Wikipedia suchen",
    notFoundSearchHint: " oder oben die Almanpedia-Suche benutzen.",
    loadFailedHeading: "Artikel konnte nicht geladen werden",
    loadFailedBody: "Die Verbindung zur Wikipedia ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
    retainedNotFound: (title: string) => `„${title}“ wurde nicht gefunden. Der vorige Artikel bleibt geöffnet.`,
    retainedLoadFailed: (title: string) => `„${title}“ konnte nicht geladen werden. Der vorige Artikel bleibt geöffnet.`,
  },

  attribution: {
    source: "Quelle: ",
    sourceLink: (title: string) => `„${title}“ (de.wikipedia.org)`,
    separator: ", ",
    authors: "Autorinnen und Autoren",
    license:
      ". Text: CC BY-SA 4.0. Die maschinelle Alman-Fassung steht als Bearbeitung unter derselben Lizenz. "
      + "Automatisch übersetzt durch ",
    errors: "; Fehler vorbehalten. Ein Projekt von ",
  },

  unsupported: {
    tag: "BESCHEID AP-507",
    heading: "Diese Browser hat kein Speicher für die Übersetzung",
    body:
      "Almanpedia übersetzt jede Artikel lokal in die Browser. Die Modell braucht mehr Speicher, "
      + "als diese Browser ein Seite gibt, und die Browser hat die Seite deshalb neu geladen.",
    advice: "Bitte öffnen Sie almanpedia.org auf ein Computer. Auf diese Telefon läuft die Übersetzung nicht.",
    note: "Almanpedia zeigt kein unübersetzte Artikel: dafür gibt es die deutschsprachige Wikipedia selbst.",
    readWikipedia: (title: string) => `„${title}“ bei die deutschsprachige Wikipedia lesen`,
    whatIsAlman: "Was ist Alman?",
  },

  landing: {
    introTitle: "Willkommen bei Almanpedia",
    introLead: [
      "Almanpedia ist die Selbstlern-Website von ",
      { href: "https://alman.ai/", text: "Alman AI", external: true },
      ". Sie richtet sich an Menschen, das Deutsch lernen und echte Texte lesen wollen, ohne für jede "
      + "Substantiv die grammatische Geschlecht auswendig lernen zu müssen.",
    ] satisfies TextPart[],
    introMethod: [
      "Alman AI entwickelt Alman, ein vereinfachte deutsche Dialekt. Alman verwendet ein einzige "
      + "Artikelform und entfernt die meiste Kasusflexionen. Die Wortschatz, Wortstellung und "
      + "Verbkonjugationen bleiben eng an die Standarddeutsche. ",
      { href: "https://alman.ai/", text: "Die interaktive Einführung auf alman.ai", external: true },
      " zeigt die Regeln Schritt für Schritt.",
    ] satisfies TextPart[],
    introNote: "Die aktuelle Inhalte der deutschsprachige Wikipedia erscheinen unten. Almanpedia übersetzt sie lokal in diese Browser.",
    discoverLabel: "Almanpedia entdecken",
    readExample: "Beispielartikel lesen",
    specification: "Alman-Spezifikation",
    guideTitle: "Ein Wort in die Adresse ändern",
    guideSteps: [
      "Bei ein Artikel der deutschsprachige Wikipedia ersetzen Sie am Anfang von ",
      { code: "wikipedia" },
      " die vier Buchstaben ",
      { code: "wiki" },
      " durch ",
      { code: "alman" },
      ". Die gleiche Artikel öffnet sich dann in Almanpedia.",
    ] satisfies TextPart[],
    guideSearchHint: "Sie können auch die Suche oben benutzen.",
    guideDownloadTitle: "Übersetzung in die Browser",
    guideDownload: [
      "Die Übersetzung läuft vollständig in Ihr Browser durch ",
      { href: "https://huggingface.co/osolmaz/GoePT-1-20M", text: "GoePT-1-20M", external: true },
      ", ein Modell mit 20 Millionen Parameter. Bei die erste Besuch lädt die Browser rund 34 MB "
      + "herunter und speichert die Modell lokal. Artikeltexte werden an kein "
      + "Almanpedia-Inferenzserver übertragen.",
    ] satisfies TextPart[],
    guideRulesTitle: "Die Regeln in die Animation",
    guideRules: [
      { term: "Alle Artikel werden die", detail: "„der“, „die“, „das“, „den“ und „dem“ fallen zu ein Form zusammen (§1a)." },
      { term: "In die Genitiv bleibt der", detail: "Die Endung fällt weg: „des Hundes“ wird der Hund (§1b, §3a)." },
      { term: "Ein für alle unbestimmte Artikel", detail: "„ein“, „eine“, „einen“ und „einem“ werden ein (§2a)." },
      { term: "Jede Adjektivendung wird -e", detail: "„ein guter Mann“ wird ein gute Mann (§4a)." },
      { term: "Kein Suffix -in", detail: "„die Lehrerin“ und „die Lehrer“ werden ein Wort (§10)." },
      { term: "Verschmelzungen werden aufgelöst", detail: "„ins Kino“ wird in die Kino (§1f)." },
    ],
    guideSpecification: "Die vollständige Spezifikation",
    feedLoading: "Inhalte der deutschsprachigen Wikipedia werden geladen …",
    feedHeading: "Aktuell in die deutschsprachige Wikipedia",
    feedOriginal: "Originale Hauptseite",
    feedError: "Die aktuelle Wikipedia-Hauptseite konnte nicht geladen werden. Bitte versuchen Sie es später erneut.",
  },

  theater: {
    chapters: {
      start: "Start",
      address: "Adresse",
      article: "Artikel",
      oneArticle: "Ein Artikel",
      examples: "Beispiele",
      endings: "Endungen",
    },
    play: "Abspielen",
    pause: "Pause",
    seek: "Durch die Szene fahren",
    chapterMarks: "Kapitel",
    speed: (rate: number) => `Geschwindigkeit ${rate}×, klicken zum Wechseln`,
    captions: {
      readWikipedia: "Almanpedia liest die deutschsprachige Wikipedia in Alman.",
      modelDownload: "Die Modell lädt ein Mal in die Browser: rund 34 MB.",
      ready: "Bereit. Kein Artikeltext verlässt diese Browser.",
      articleFromWikipedia: "Ein Artikel der deutschsprachige Wikipedia.",
      markWiki: "Vier Buchstaben markieren: „wiki“.",
      typeAlman: "„alman“ tippen.",
      alias: "de.almanpedia.org führt auf die gleiche Pfad.",
      sameArticle: "Die gleiche Artikel, jetzt in Almanpedia.",
      stillStandard: "Die Text steht noch in Standarddeutsch.",
      lineByLine: "Die Übersetzung liest die Artikel Zeile für Zeile.",
      shake: "Jede Stelle zittert kurz und wechselt dann.",
      onePass: "Artikel, Endungen und Pronomen in ein Durchgang.",
      done: "Fertig. Diese Absatz steht jetzt in Alman.",
      fiveForms: "Standarddeutsch hat fünf Formen für ein Artikel.",
      oneFormLeft: "In Alman bleibt ein Form übrig.",
      genitiveException: "Ein Ausnahme: in die Genitiv steht der, wie in „die Haus der Mann“.",
      threeGenders: "Drei Substantive, drei Genus in Standarddeutsch.",
      threePhrases: "die Mann, die Frau, die Kind.",
      nounUnchanged: "Die Substantiv bleibt, wie es war.",
      endingsRules: "Die Endungen folgen wenige Regeln.",
      oneRuleSet: "Ein Artikel, ein Adjektivendung, kein Genusregeln.",
      everyArticle: "Jede Artikel der deutschsprachige Wikipedia, lokal vereinfacht.",
    },
    /** The line under each example card in the figure. */
    cardNotes: {
      suffixIn: "Die Suffix -in fällt weg. Ein Form für alle Person.",
      adjectiveEnding: "Jede Adjektivendung wird -e.",
      genitive: "In die Genitiv bleibt der, die Endung fällt weg.",
      dativePlural: "Kein Dativ-n in die Plural.",
      contraction: "Verschmelzungen wie „ins“ werden aufgelöst.",
      pluralS: "Ein -s hilft, wenn Singular und Plural gleich sind.",
    },
  },
};

export type Messages = typeof deMessages;
export type CardNoteKey = keyof Messages["theater"]["cardNotes"];
export type ChapterKey = keyof Messages["theater"]["chapters"];

const enMessages: Messages = {
  htmlLang: "en",
  documentTitle: "Almanpedia — The free encyclopedia, simplified",
  documentDescription:
    "Almanpedia translates articles from the German Wikipedia into Alman, a constructed dialect of "
    + "German without grammatical gender. The translation runs entirely in the browser.",
  brandWordmarkAlt: "ALMANPEDIA – The free encyclopedia, simplified",

  search: {
    placeholder: "Search articles …",
    label: "Search articles",
  },

  language: {
    label: "Language",
    de: "German",
    en: "English",
  },

  footer: [
    "Content from ",
    { href: "https://de.wikipedia.org", text: "German Wikipedia", external: true },
    ", text licensed under ",
    { href: "https://creativecommons.org/licenses/by-sa/4.0/deed.en", text: "CC BY-SA 4.0", external: true },
    ". Translated to ",
    { href: "https://alman.ai", text: "Alman", external: true },
    " by ",
    { href: "https://huggingface.co/osolmaz/GoePT-1-20M", text: "GoePT-1-20M", external: true },
    ", locally in the browser. A project by alman.ai.",
  ],

  progress: {
    loadingModel: (percent: number) => `LOADING MODEL: ${percent} %`,
    preparingModel: "PREPARING MODEL …",
    translatingMainPage: (percent: number) => `TRANSLATING MAIN PAGE: ${percent} %`,
    translatingArticle: (percent: number) => `TRANSLATING ARTICLE: ${percent} %`,
    preparingTranslation: "PREPARING TRANSLATION …",
    loadingArticle: (title: string) => `LOADING “${title}” …`,
  },

  contents: {
    heading: "Contents",
    label: "Table of contents",
    section: (index: number) => `Section ${index}`,
  },

  settings: {
    panelTitle: "Appearance",
    textGroup: "Text",
    textSmall: "Small",
    textStandard: "Standard",
    textLarge: "Large",
    colorGroup: "Color",
    colorAuto: "Automatic",
    colorLight: "Light",
    colorDark: "Dark",
    translationGroup: "Translation",
    translationWave: "Glow while translating",
    changeEffects: "Animate changed words",
    note: "Your choice is saved in this browser.",
    close: "Hide",
  },

  reader: {
    viewLabel: "View",
    tabAlman: "Alman",
    tabOriginal: "Original",
    tabChanges: "Changes",
    differenceRemoved: "Struck through: German original.",
    differenceAdded: "Blue: Alman version.",
    translationUnavailableArticle: "Translation unavailable. The original is shown.",
    translationUnavailableMainPage: "Translation unavailable. The German main page stays visible.",
    slowLoad: "Loading is taking longer than usual.",
    retry: "Try again",
    openOriginal: "Open the original on Wikipedia",
    notFoundTag: "NOTICE AP-404",
    failureTag: "FAULT REPORT",
    notFoundHeading: "Article not found",
    notFoundBody: (title: string) => `No article named “${title}” is recorded.`,
    notFoundSearch: "Search Wikipedia",
    notFoundSearchHint: " or use the Almanpedia search above.",
    loadFailedHeading: "The article could not be loaded",
    loadFailedBody: "The connection to Wikipedia failed. Please try again.",
    retainedNotFound: (title: string) => `“${title}” was not found. The previous article stays open.`,
    retainedLoadFailed: (title: string) => `“${title}” could not be loaded. The previous article stays open.`,
  },

  attribution: {
    source: "Source: ",
    sourceLink: (title: string) => `“${title}” (de.wikipedia.org)`,
    separator: ", ",
    authors: "Authors",
    license:
      ". Text: CC BY-SA 4.0. The machine translation into Alman is a derivative under the same license. "
      + "Translated automatically by ",
    errors: "; errors may remain. A project by ",
  },

  unsupported: {
    tag: "NOTICE AP-507",
    heading: "This browser has no memory for the translation",
    body:
      "Almanpedia translates every article locally in the browser. The model needs more memory than "
      + "this browser gives a page, so the browser reloaded the page.",
    advice: "Please open almanpedia.org on a computer. Translation does not run on this phone.",
    note: "Almanpedia does not show untranslated articles, which is what the German Wikipedia is for.",
    readWikipedia: (title: string) => `Read “${title}” on the German Wikipedia`,
    whatIsAlman: "What is Alman?",
  },

  landing: {
    introTitle: "Welcome to Almanpedia",
    introLead: [
      "Almanpedia is the self-study site from ",
      { href: "https://alman.ai/", text: "Alman AI", external: true },
      ". It is for people who are learning German and want to read real texts without memorizing the "
      + "grammatical gender of every noun.",
    ],
    introMethod: [
      "Alman AI develops Alman, a simplified German dialect. Alman uses a single article form and "
      + "removes most case inflection. Vocabulary, word order and verb conjugations stay close to "
      + "Standard German. ",
      { href: "https://alman.ai/", text: "The interactive introduction at alman.ai", external: true },
      " shows the rules step by step.",
    ],
    introNote: "The current content of the German Wikipedia appears below. Almanpedia translates it locally in this browser.",
    discoverLabel: "Discover Almanpedia",
    readExample: "Read the example article",
    specification: "Alman specification",
    guideTitle: "Change one word in the address",
    guideSteps: [
      "On any article of the German Wikipedia, replace the four letters ",
      { code: "wiki" },
      " at the start of ",
      { code: "wikipedia" },
      " with ",
      { code: "alman" },
      ". The same article then opens in Almanpedia.",
    ],
    guideSearchHint: "You can also use the search above.",
    guideDownloadTitle: "Translation in the browser",
    guideDownload: [
      "The translation runs entirely in your browser through ",
      { href: "https://huggingface.co/osolmaz/GoePT-1-20M", text: "GoePT-1-20M", external: true },
      ", a model with 20 million parameters. On the first visit the browser downloads about 34 MB and "
      + "stores the model locally. Article texts are never sent to an Almanpedia inference server.",
    ],
    guideRulesTitle: "The rules in the animation",
    guideRules: [
      { term: "All articles become die", detail: "“der”, “die”, “das”, “den” and “dem” collapse into one form (§1a)." },
      { term: "The genitive keeps der", detail: "The ending falls away: “des Hundes” becomes der Hund (§1b, §3a)." },
      { term: "One indefinite article for all", detail: "“ein”, “eine”, “einen” and “einem” become ein (§2a)." },
      { term: "Every adjective ending becomes -e", detail: "“ein guter Mann” becomes ein gute Mann (§4a)." },
      { term: "No -in suffix", detail: "“die Lehrerin” and “die Lehrer” become one word (§10)." },
      { term: "Contractions are opened up", detail: "“ins Kino” becomes in die Kino (§1f)." },
    ],
    guideSpecification: "The complete specification",
    feedLoading: "Loading content from the German Wikipedia …",
    feedHeading: "Currently on the German Wikipedia",
    feedOriginal: "Original main page",
    feedError: "The current Wikipedia main page could not be loaded. Please try again later.",
  },

  theater: {
    chapters: {
      start: "Start",
      address: "Address",
      article: "Article",
      oneArticle: "One article",
      examples: "Examples",
      endings: "Endings",
    },
    play: "Play",
    pause: "Pause",
    seek: "Scrub through the scene",
    chapterMarks: "Chapters",
    speed: (rate: number) => `Speed ${rate}×, click to change`,
    captions: {
      readWikipedia: "Almanpedia reads the German Wikipedia in Alman.",
      modelDownload: "The model loads into the browser once: about 34 MB.",
      ready: "Ready. No article text leaves this browser.",
      articleFromWikipedia: "An article from the German Wikipedia.",
      markWiki: "Select four letters: “wiki”.",
      typeAlman: "Type “alman”.",
      alias: "de.almanpedia.org leads to the same path.",
      sameArticle: "The same article, now in Almanpedia.",
      stillStandard: "The text is still Standard German.",
      lineByLine: "The translation reads the article line by line.",
      shake: "Each spot shakes briefly and then changes.",
      onePass: "Articles, endings and pronouns in one pass.",
      done: "Done. This paragraph is now in Alman.",
      fiveForms: "Standard German has five forms for one article.",
      oneFormLeft: "In Alman one form remains.",
      genitiveException: "One exception: the genitive keeps der, as in “die Haus der Mann”.",
      threeGenders: "Three nouns, three genders in Standard German.",
      // The figure's own examples stay in Alman, which is the point of the act.
      threePhrases: "die Mann, die Frau, die Kind.",
      nounUnchanged: "The noun stays as it was.",
      endingsRules: "The endings follow fewer rules.",
      oneRuleSet: "One article, one adjective ending, no gender rules.",
      everyArticle: "Every article of the German Wikipedia, simplified locally.",
    },
    cardNotes: {
      suffixIn: "The -in suffix falls away. One form for every person.",
      adjectiveEnding: "Every adjective ending becomes -e.",
      genitive: "The genitive keeps der and the ending falls away.",
      dativePlural: "No dative -n in the plural.",
      contraction: "Contractions like “ins” are opened up.",
      pluralS: "An -s helps where the singular and plural are the same.",
    },
  },
};

export const MESSAGES: Record<Locale, Messages> = { de: deMessages, en: enMessages };

export function isLocale(value: unknown): value is Locale {
  return value === "de" || value === "en";
}

let current: Locale = DEFAULT_LOCALE;

export function currentLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
}

/** The messages for the locale in force. Read at render time, never cached. */
export function uiText(): Messages {
  return MESSAGES[current];
}

/** Local storage where it is usable, and a per-call map where it is not. */
export function browserStorage(area: "local" | "session" = "local"): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  const memory: Pick<Storage, "getItem" | "setItem"> = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
  try {
    return area === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    // Private and partitioned contexts can throw on access alone.
    return memory;
  }
}

/**
 * The locale of this document. An explicit `?lang=` beats the stored preference,
 * so a shared link opens in the language it names, and anything unrecognised
 * falls back to German.
 */
export function readLocale(search: string, storage: Pick<Storage, "getItem">): Locale {
  const asked = new URLSearchParams(search).get(LOCALE_QUERY_KEY);
  if (isLocale(asked)) return asked;
  let stored: string | null = null;
  try {
    stored = storage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    stored = null;
  }
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function saveLocale(storage: Pick<Storage, "setItem">, locale: Locale): void {
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // A locale that cannot be remembered is still a locale for this visit.
  }
}

/**
 * The same address, asked for in one locale. German is the site's own language,
 * so choosing it takes the parameter out again instead of naming a default.
 */
export function localeHref(href: string, locale: Locale): string {
  const url = new URL(href, window.location.href);
  if (locale === DEFAULT_LOCALE) url.searchParams.delete(LOCALE_QUERY_KEY);
  else url.searchParams.set(LOCALE_QUERY_KEY, locale);
  return url.pathname + url.search + url.hash;
}

/**
 * Read the locale, put it in force, and remember the choice. Returns the locale
 * so the caller can write it onto the document before anything renders.
 */
export function applyLocale(
  search: string = window.location.search,
  storage: Pick<Storage, "getItem" | "setItem"> = browserStorage(),
): Locale {
  const locale = readLocale(search, storage);
  saveLocale(storage, locale);
  setLocale(locale);
  document.documentElement.lang = uiText().htmlLang;
  return locale;
}
