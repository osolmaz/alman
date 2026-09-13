// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  MESSAGES,
  applyLocale,
  currentLocale,
  localeHref,
  readLocale,
  saveLocale,
  setLocale,
  uiText,
} from "../src/i18n";
import { renderLanding, renderShell } from "../src/ui/views";
import { startRouter } from "../src/router";

afterEach(() => {
  setLocale(DEFAULT_LOCALE);
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
  document.documentElement.lang = "de";
});

function store(
  entries: Record<string, string> = {},
): Pick<Storage, "getItem" | "setItem"> & { values: Map<string, string> } {
  const values = new Map(Object.entries(entries));
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => void values.set(key, value) };
}

/** Keys whose German and English entries are the same string. */
function shared(german: Record<string, string>, english: Record<string, string>): string[] {
  return Object.keys(german).filter((key) => german[key] === english[key]);
}

describe("which language a document is in", () => {
  test("the address beats the stored preference", () => {
    expect(readLocale("?lang=en", store({ [LOCALE_STORAGE_KEY]: "de" }))).toBe("en");
    expect(readLocale("", store({ [LOCALE_STORAGE_KEY]: "en" }))).toBe("en");
  });

  test("anything unrecognised falls back to German", () => {
    expect(readLocale("?lang=fr", store({ [LOCALE_STORAGE_KEY]: "en" }))).toBe("en");
    expect(readLocale("?lang=fr", store({ [LOCALE_STORAGE_KEY]: "al" }))).toBe("de");
    expect(readLocale("?lang=de-x-alman", store())).toBe("de");
    expect(readLocale("", store())).toBe("de");
  });

  test("storage that throws on read is not fatal", () => {
    const hostile = {
      getItem(): string | null {
        throw new Error("blocked");
      },
      setItem(): void {
        throw new Error("blocked");
      },
    };
    expect(readLocale("", hostile)).toBe("de");
    expect(() => saveLocale(hostile, "en")).not.toThrow();
  });

  test("a chosen language is written back and put in force with the document", () => {
    const storage = store();
    expect(applyLocale("?lang=en", storage)).toBe("en");
    expect(storage.values.get(LOCALE_STORAGE_KEY)).toBe("en");
    expect(currentLocale()).toBe("en");
    // What a screen reader and a spell checker read the page as.
    expect(document.documentElement.lang).toBe("en");
  });

  test("the address carries the choice, and drops it again for German", () => {
    expect(localeHref("https://almanpedia.org/wiki/Kartoffel#Anbau", "en"))
      .toBe("/wiki/Kartoffel?lang=en#Anbau");
    expect(localeHref("https://almanpedia.org/wiki/Kartoffel?lang=en", "de")).toBe("/wiki/Kartoffel");
    expect(localeHref("https://almanpedia.org/?lang=en", "de")).toBe("/");
  });
});

describe("the two message tables", () => {
  test("English is a translation, not the German text under a new name", () => {
    const { de, en } = MESSAGES;

    // Act 5 shows Alman words, so its caption is the material rather than a line
    // about it and reads the same in both locales. Every other caption is written.
    expect(shared(de.theater.captions, en.theater.captions)).toEqual(["threePhrases"]);
    expect(shared(de.theater.cardNotes, en.theater.cardNotes)).toEqual([]);
    // Start is Start; the other chapter names are written out.
    expect(shared(de.theater.chapters, en.theater.chapters)).toEqual(["start"]);
    expect(en.landing.introTitle).not.toBe(de.landing.introTitle);
    expect(en.documentTitle).not.toBe(de.documentTitle);
  });

  test("every message in both tables carries text", () => {
    for (const locale of ["de", "en"] as const) {
      const leaves: string[] = [];
      const walk = (value: unknown): void => {
        if (typeof value === "string") leaves.push(value);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") Object.values(value).forEach(walk);
      };
      walk(MESSAGES[locale]);
      expect(leaves.length).toBeGreaterThan(80);
      expect(leaves.filter((text) => text.trim().length === 0)).toEqual([]);
    }
  });

  test("uiText follows the locale in force", () => {
    expect(uiText().search.placeholder).toBe("Artikel suchen …");
    setLocale("en");
    expect(uiText().search.placeholder).toBe("Search articles …");
  });
});

describe("the switch and the pages it builds", () => {
  test("the header offers both languages and marks the one in force", () => {
    const root = document.createElement("div");
    document.body.append(root);
    renderShell(root, () => {});
    const options = [...root.querySelectorAll<HTMLButtonElement>(".site-header .locale-option")];

    expect(options.map((option) => option.textContent)).toEqual(["DE", "EN"]);
    expect(options.map((option) => option.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    expect(options.map((option) => option.getAttribute("lang"))).toEqual(["de", "en"]);
    expect(root.querySelector(".site-header .locale-switch")?.getAttribute("aria-label")).toBe("Sprache");
  });

  test("choosing the other language remembers it and reloads the address it belongs to", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, href: "https://almanpedia.org/wiki/Kartoffel", assign });
    const root = document.createElement("div");
    document.body.append(root);
    renderShell(root, () => {});
    const english = root.querySelectorAll<HTMLButtonElement>(".site-header .locale-option")[1]!;

    english.click();

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(assign).toHaveBeenCalledWith("/wiki/Kartoffel?lang=en");
  });

  test("choosing the language already in force does nothing", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, href: "https://almanpedia.org/", assign });
    const root = document.createElement("div");
    document.body.append(root);
    renderShell(root, () => {});

    root.querySelectorAll<HTMLButtonElement>(".site-header .locale-option")[0]!.click();

    expect(assign).not.toHaveBeenCalled();
  });

  test("an address keeps the language the page is being read in", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const { navigate } = startRouter(() => {});

    navigate("/wiki/Kartoffel");
    expect(window.location.pathname + window.location.search).toBe("/wiki/Kartoffel");

    setLocale("en");
    navigate("/wiki/Kartoffel#Herkunft");
    expect(window.location.pathname + window.location.search).toBe("/wiki/Kartoffel?lang=en");
  });

  test("the German page is still German end to end", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const root = document.createElement("div");
    document.body.append(root);
    const shell = renderShell(root, () => {});

    await renderLanding(shell);

    expect(document.title).toBe("Almanpedia — Die freie Enzyklopädie, vereinfacht");
    expect(root.querySelector<HTMLInputElement>(".search-box input")?.placeholder).toBe("Artikel suchen …");
    expect(shell.footer.textContent).toContain("Text lizenziert unter");
    expect(shell.main.textContent).toContain("Willkommen bei Almanpedia");
    expect(shell.main.textContent).toContain("Ein Wort in die Adresse ändern");
  });

  test("the English page speaks English where the site talks and keeps German where the material starts", async () => {
    setLocale("en");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const root = document.createElement("div");
    document.body.append(root);
    const shell = renderShell(root, () => {});

    await renderLanding(shell);

    expect(document.title).toBe("Almanpedia — The free encyclopedia, simplified");
    expect(root.querySelector<HTMLInputElement>(".search-box input")?.placeholder).toBe("Search articles …");
    expect(shell.footer.textContent).toContain("Content from");
    expect(shell.main.textContent).toContain("Welcome to Almanpedia");
    expect(shell.main.textContent).toContain("Change one word in the address");
    // The feed is the German Wikipedia and says so, as does the article the
    // figure turns over; only the narration and the notes are English.
    expect(shell.main.querySelector(".landing-feed")?.getAttribute("lang")).toBe("de");
    const figure = shell.main.querySelector("[data-theater]")!;
    expect(figure.querySelector(".th-caption")?.getAttribute("lang")).toBe("en");
    expect(figure.querySelector(".th-page")?.getAttribute("lang")).toBe("de");
    expect(figure.querySelector(".th-page")?.textContent).toMatch(/Hypothese|Umwelt|Sprache/u);
    expect(figure.querySelector("[data-card] .th-card-note")?.textContent)
      .toBe("The -in suffix falls away. One form for every person.");
    expect(figure.querySelector(".th-chapters")?.getAttribute("aria-label")).toBe("Chapters");
  });
});
