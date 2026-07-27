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
});

test("reader effects default to enabled", () => {
  expect(defaultReaderSettings()).toEqual({ translationWave: true, changeEffects: true });
  expect(loadReaderSettings(memoryStorage({ [READER_SETTINGS_STORAGE_KEY]: "invalid" }))).toEqual({
    translationWave: true,
    changeEffects: true,
  });
});

test("saved reader settings override enabled defaults", () => {
  const storage = memoryStorage();
  saveReaderSettings(storage, { translationWave: false, changeEffects: false });

  expect(loadReaderSettings(storage)).toEqual({ translationWave: false, changeEffects: false });
});

test("settings panel applies and persists changes", () => {
  const storage = memoryStorage();
  const panel = createReaderSettingsPanel(document.documentElement, storage);
  document.body.append(panel.element);
  const inputs = panel.element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

  expect(document.documentElement.dataset.translationWave).toBe("on");
  expect(document.documentElement.dataset.changeEffects).toBe("on");
  inputs[0]!.checked = false;
  inputs[0]!.dispatchEvent(new Event("change"));

  expect(panel.settings()).toEqual({ translationWave: false, changeEffects: true });
  expect(document.documentElement.dataset.translationWave).toBe("off");
  expect(JSON.parse(storage.getItem(READER_SETTINGS_STORAGE_KEY)!)).toEqual({
    version: 1,
    translationWave: false,
    changeEffects: true,
  });
});

test("applyReaderSettings exposes stable CSS switches", () => {
  applyReaderSettings(document.documentElement, { translationWave: false, changeEffects: true });
  expect(document.documentElement.dataset).toMatchObject({ translationWave: "off", changeEffects: "on" });
});
