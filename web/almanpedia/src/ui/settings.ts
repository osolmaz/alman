import { el } from "./dom";

export const READER_SETTINGS_STORAGE_KEY = "almanpedia:reader-settings:v1";

export interface ReaderSettings {
  translationWave: boolean;
  changeEffects: boolean;
}

interface StoredReaderSettings extends ReaderSettings {
  version: 1;
}

export function defaultReaderSettings(): ReaderSettings {
  return {
    translationWave: true,
    changeEffects: true,
  };
}

export function loadReaderSettings(storage: Pick<Storage, "getItem">): ReaderSettings {
  try {
    const value = storage.getItem(READER_SETTINGS_STORAGE_KEY);
    if (!value) return defaultReaderSettings();
    const parsed = JSON.parse(value) as Partial<StoredReaderSettings>;
    if (
      parsed.version !== 1 ||
      typeof parsed.translationWave !== "boolean" ||
      typeof parsed.changeEffects !== "boolean"
    ) {
      return defaultReaderSettings();
    }
    return {
      translationWave: parsed.translationWave,
      changeEffects: parsed.changeEffects,
    };
  } catch {
    return defaultReaderSettings();
  }
}

export function saveReaderSettings(storage: Pick<Storage, "setItem">, settings: ReaderSettings): void {
  const value: StoredReaderSettings = { version: 1, ...settings };
  try {
    storage.setItem(READER_SETTINGS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function applyReaderSettings(root: HTMLElement, settings: ReaderSettings): void {
  root.dataset.translationWave = settings.translationWave ? "on" : "off";
  root.dataset.changeEffects = settings.changeEffects ? "on" : "off";
}

function settingRow(label: string, input: HTMLInputElement): HTMLLabelElement {
  return el("label", { class: "reader-setting" }, [input, el("span", {}, [label])]);
}

export function createReaderSettingsPanel(
  root: HTMLElement,
  storage: Pick<Storage, "getItem" | "setItem">,
): { element: HTMLDetailsElement; settings: () => ReaderSettings } {
  let settings = loadReaderSettings(storage);
  applyReaderSettings(root, settings);

  const wave = el("input", { type: "checkbox" });
  wave.checked = settings.translationWave;
  const changes = el("input", { type: "checkbox" });
  changes.checked = settings.changeEffects;

  const update = () => {
    settings = {
      translationWave: wave.checked,
      changeEffects: changes.checked,
    };
    applyReaderSettings(root, settings);
    saveReaderSettings(storage, settings);
  };
  wave.addEventListener("change", update);
  changes.addEventListener("change", update);

  const element = el("details", { class: "reader-settings" }, [
    el("summary", {}, ["Darstellung"]),
    el("div", { class: "reader-settings-body" }, [
      el("h2", {}, ["Darstellung"]),
      settingRow("Leuchteffekt beim Übersetzen", wave),
      settingRow("Geänderte Wörter animieren", changes),
      el("p", { class: "reader-settings-note" }, ["Die Auswahl wird in diesem Browser gespeichert."]),
    ]),
  ]);
  return { element, settings: () => settings };
}
