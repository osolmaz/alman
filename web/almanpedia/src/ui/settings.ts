import { el } from "./dom";

export const READER_SETTINGS_STORAGE_KEY = "almanpedia:reader-settings:v1";

export type TextSize = "small" | "standard" | "large";
export type ColorMode = "auto" | "light" | "dark";

export interface ReaderSettings {
  translationWave: boolean;
  changeEffects: boolean;
  textSize: TextSize;
  colorMode: ColorMode;
}

interface StoredReaderSettings extends ReaderSettings {
  version: 1;
}

export function defaultReaderSettings(): ReaderSettings {
  return {
    translationWave: true,
    changeEffects: true,
    textSize: "standard",
    colorMode: "light",
  };
}

function isTextSize(value: unknown): value is TextSize {
  return value === "small" || value === "standard" || value === "large";
}

function isColorMode(value: unknown): value is ColorMode {
  return value === "auto" || value === "light" || value === "dark";
}

export function loadReaderSettings(storage: Pick<Storage, "getItem">): ReaderSettings {
  try {
    const value = storage.getItem(READER_SETTINGS_STORAGE_KEY);
    if (!value) return defaultReaderSettings();
    const parsed = JSON.parse(value) as Partial<StoredReaderSettings>;
    if (
      parsed.version !== 1 ||
      typeof parsed.translationWave !== "boolean" ||
      typeof parsed.changeEffects !== "boolean" ||
      !isTextSize(parsed.textSize) ||
      !isColorMode(parsed.colorMode)
    ) {
      return defaultReaderSettings();
    }
    return {
      translationWave: parsed.translationWave,
      changeEffects: parsed.changeEffects,
      textSize: parsed.textSize,
      colorMode: parsed.colorMode,
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
  root.dataset.textSize = settings.textSize;
  root.dataset.colorMode = settings.colorMode;
}

function checkboxRow(label: string, input: HTMLInputElement): HTMLLabelElement {
  return el("label", { class: "reader-setting" }, [input, el("span", {}, [label])]);
}

function choiceGroup<T extends string>(
  legend: string,
  name: string,
  choices: ReadonlyArray<readonly [value: T, label: string]>,
  selected: T,
): { element: HTMLFieldSetElement; inputs: Map<T, HTMLInputElement> } {
  const inputs = new Map<T, HTMLInputElement>();
  const rows = choices.map(([value, label]) => {
    const input = el("input", {
      id: `reader-${name}-${value}`,
      name: `reader-${name}`,
      type: "radio",
      value,
    });
    input.checked = value === selected;
    inputs.set(value, input);
    return el("label", { class: "reader-choice", for: input.id }, [input, el("span", {}, [label])]);
  });
  return {
    element: el("fieldset", { class: "reader-setting-group" }, [el("legend", {}, [legend]), ...rows]),
    inputs,
  };
}

function selectedChoice<T extends string>(inputs: Map<T, HTMLInputElement>): T {
  for (const [value, input] of inputs) {
    if (input.checked) return value;
  }
  return inputs.keys().next().value as T;
}

export function createReaderSettingsPanel(
  root: HTMLElement,
  storage: Pick<Storage, "getItem" | "setItem">,
): {
  element: HTMLElement;
  settings: () => ReaderSettings;
  expanded: () => boolean;
  setExpanded: (expanded: boolean) => void;
} {
  let settings = loadReaderSettings(storage);
  applyReaderSettings(root, settings);

  const text = choiceGroup(
    "Text",
    "text-size",
    [
      ["small", "Klein"],
      ["standard", "Standard"],
      ["large", "Groß"],
    ] as const,
    settings.textSize,
  );
  const color = choiceGroup(
    "Farbe",
    "color-mode",
    [
      ["auto", "Automatisch"],
      ["light", "Hell"],
      ["dark", "Dunkel"],
    ] as const,
    settings.colorMode,
  );
  const wave = el("input", { type: "checkbox" });
  wave.checked = settings.translationWave;
  const changes = el("input", { type: "checkbox" });
  changes.checked = settings.changeEffects;

  const update = () => {
    settings = {
      translationWave: wave.checked,
      changeEffects: changes.checked,
      textSize: selectedChoice(text.inputs),
      colorMode: selectedChoice(color.inputs),
    };
    applyReaderSettings(root, settings);
    saveReaderSettings(storage, settings);
  };
  for (const input of [...text.inputs.values(), ...color.inputs.values(), wave, changes]) {
    input.addEventListener("change", update);
  }

  const close = el("button", { class: "reader-settings-close", type: "button" }, ["Verbergen"]);
  const element = el("section", { class: "reader-settings", "data-expanded": "false" }, [
    el("div", { class: "reader-settings-header" }, [el("h2", {}, ["Erscheinungsbild"]), close]),
    el("div", { class: "reader-settings-body" }, [
      text.element,
      color.element,
      el("fieldset", { class: "reader-setting-group" }, [
        el("legend", {}, ["Übersetzung"]),
        checkboxRow("Leuchteffekt beim Übersetzen", wave),
        checkboxRow("Geänderte Wörter animieren", changes),
      ]),
      el("p", { class: "reader-settings-note" }, ["Die Auswahl wird in diesem Browser gespeichert."]),
    ]),
  ]);

  const setExpanded = (expanded: boolean) => {
    element.dataset.expanded = String(expanded);
    element.dispatchEvent(new Event("toggle"));
  };
  close.addEventListener("click", () => setExpanded(false));

  return {
    element,
    settings: () => settings,
    expanded: () => element.dataset.expanded === "true",
    setExpanded,
  };
}
