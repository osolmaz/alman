// @vitest-environment happy-dom
import { beforeEach, expect, test } from "vitest";
import {
  READER_SETTINGS_STORAGE_KEY,
  applyReaderSettings,
  createReaderSettingsPanel,
  defaultReaderSettings,
  loadReaderSettings,
  saveReaderSettings,
} from "../src/ui/settings";

function memoryStorage(initial?: Record<string, string>): Storage {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("data-translation-wave");
  document.documentElement.removeAttribute("data-change-effects");
  document.documentElement.removeAttribute("data-text-size");
  document.documentElement.removeAttribute("data-color-mode");
});

test("reader settings use Wikipedia-like standard text and light color defaults", () => {
  const defaults = {
    translationWave: true,
    changeEffects: true,
    textSize: "standard",
    colorMode: "light",
  };
  expect(defaultReaderSettings()).toEqual(defaults);
  expect(loadReaderSettings(memoryStorage({ [READER_SETTINGS_STORAGE_KEY]: "invalid" }))).toEqual(defaults);
});

test("saved reader settings override every default", () => {
  const storage = memoryStorage();
  const settings = {
    translationWave: false,
    changeEffects: false,
    textSize: "large" as const,
    colorMode: "dark" as const,
  };
  saveReaderSettings(storage, settings);

  expect(loadReaderSettings(storage)).toEqual(settings);
});

test("settings panel applies and persists changes", () => {
  const storage = memoryStorage();
  const panel = createReaderSettingsPanel(document.documentElement, storage);
  document.body.append(panel.element);
  const wave = panel.element.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  const large = panel.element.querySelector<HTMLInputElement>("#reader-text-size-large")!;
  const dark = panel.element.querySelector<HTMLInputElement>("#reader-color-mode-dark")!;

  expect(document.documentElement.dataset).toMatchObject({
    translationWave: "on",
    changeEffects: "on",
    textSize: "standard",
    colorMode: "light",
  });
  wave.checked = false;
  wave.dispatchEvent(new Event("change"));
  large.checked = true;
  large.dispatchEvent(new Event("change"));
  dark.checked = true;
  dark.dispatchEvent(new Event("change"));

  expect(panel.settings()).toEqual({
    translationWave: false,
    changeEffects: true,
    textSize: "large",
    colorMode: "dark",
  });
  expect(document.documentElement.dataset).toMatchObject({
    translationWave: "off",
    changeEffects: "on",
    textSize: "large",
    colorMode: "dark",
  });
  expect(JSON.parse(storage.getItem(READER_SETTINGS_STORAGE_KEY)!)).toEqual({
    version: 1,
    translationWave: false,
    changeEffects: true,
    textSize: "large",
    colorMode: "dark",
  });
});

test("settings panel exposes text and color controls and can close", () => {
  const panel = createReaderSettingsPanel(document.documentElement, memoryStorage());
  document.body.append(panel.element);

  expect([...panel.element.querySelectorAll("legend")].map((legend) => legend.textContent)).toEqual([
    "Text",
    "Farbe",
    "Übersetzung",
  ]);
  expect(panel.element.textContent).toContain("KleinStandardGroß");
  expect(panel.element.textContent).toContain("AutomatischHellDunkel");
  panel.setExpanded(true);
  expect(panel.expanded()).toBe(true);
  panel.element.querySelector<HTMLButtonElement>(".reader-settings-close")!.click();
  expect(panel.expanded()).toBe(false);
});

test("applyReaderSettings exposes stable CSS switches", () => {
  applyReaderSettings(document.documentElement, {
    translationWave: false,
    changeEffects: true,
    textSize: "small",
    colorMode: "auto",
  });
  expect(document.documentElement.dataset).toMatchObject({
    translationWave: "off",
    changeEffects: "on",
    textSize: "small",
    colorMode: "auto",
  });
});
