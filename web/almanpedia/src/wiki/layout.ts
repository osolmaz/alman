export type WikiLayoutDiagnosticReason =
  | "removed-absolute-position"
  | "removed-all-reset"
  | "removed-fixed-position"
  | "removed-sticky-position"
  | "removed-transform"
  | "removed-viewport-size"
  | "removed-z-index";

export interface WikiLayoutDiagnostic {
  reason: WikiLayoutDiagnosticReason;
  tag: string;
}

const THUMB_TYPE = "mw:File/Thumb";
const RIGHT_CLASSES = ["float-right", "tright", "mw-halign-right"];
const LEFT_CLASSES = ["float-left", "tleft", "mw-halign-left"];

function hasAnyClass(element: Element, classes: string[]): boolean {
  return classes.some((name) => element.classList.contains(name));
}

function setFloat(element: Element, side: "left" | "right"): void {
  element.setAttribute("data-wiki-float", side);
}

function normalizeFloat(element: HTMLElement): void {
  const declared = element.style.float;
  if (declared === "right" || hasAnyClass(element, RIGHT_CLASSES)) setFloat(element, "right");
  else if (declared === "left" || hasAnyClass(element, LEFT_CLASSES)) setFloat(element, "left");

  const clear = element.style.clear;
  if (clear === "right" || clear === "left" || clear === "both") {
    element.setAttribute("data-wiki-clear", clear);
  }
  element.style.removeProperty("float");
  element.style.removeProperty("clear");
}

function removeUnsafeLayout(element: HTMLElement, diagnostics: WikiLayoutDiagnostic[]): void {
  if (element.style.getPropertyValue("all")) {
    element.style.removeProperty("all");
    diagnostics.push({ reason: "removed-all-reset", tag: element.tagName.toLowerCase() });
  }
  const position = element.style.position;
  if (position === "absolute" || position === "fixed" || position === "sticky") {
    element.style.removeProperty("position");
    for (const property of ["inset", "inset-block", "inset-inline", "top", "right", "bottom", "left"]) {
      element.style.removeProperty(property);
    }
    diagnostics.push({
      reason:
        position === "absolute"
          ? "removed-absolute-position"
          : position === "fixed"
            ? "removed-fixed-position"
            : "removed-sticky-position",
      tag: element.tagName.toLowerCase(),
    });
  }
  if (element.style.transform && element.style.transform !== "none") {
    element.style.removeProperty("transform");
    diagnostics.push({ reason: "removed-transform", tag: element.tagName.toLowerCase() });
  }
  const zIndex = element.style.zIndex;
  if (zIndex && zIndex !== "auto") {
    element.style.removeProperty("z-index");
    diagnostics.push({ reason: "removed-z-index", tag: element.tagName.toLowerCase() });
  }
  for (const property of ["width", "min-width", "max-width", "height", "min-height", "max-height"]) {
    const value = element.style.getPropertyValue(property);
    if (/\b\d*\.?\d+(?:[dls]?v[wh]|vmin|vmax)\b/iu.test(value)) {
      element.style.removeProperty(property);
      diagnostics.push({ reason: "removed-viewport-size", tag: element.tagName.toLowerCase() });
    }
  }
}

function classifyFigure(figure: HTMLElement, types: Set<string>): void {
  if (types.has(THUMB_TYPE) || figure.dataset.wikiComponent === "thumbnail") {
    figure.setAttribute("data-wiki-component", "thumbnail");
    if (!figure.hasAttribute("data-wiki-float")) setFloat(figure, "right");
  } else if (!figure.hasAttribute("data-wiki-component")) {
    figure.setAttribute("data-wiki-component", "figure");
  }
}

function classifyKnownComponent(element: HTMLElement, types: Set<string>): void {
  if (element instanceof HTMLTableElement && element.classList.contains("infobox")) {
    element.setAttribute("data-wiki-component", "infobox");
    if (!element.hasAttribute("data-wiki-float")) setFloat(element, "right");
  } else if (element.classList.contains("linkbox")) {
    element.setAttribute("data-wiki-component", "linkbox");
  } else if (element.classList.contains("navbox")) {
    element.setAttribute("data-wiki-component", "navbox");
  } else if (element.classList.contains("gallery")) {
    element.setAttribute("data-wiki-component", "gallery");
  } else if (element.classList.contains("sisterproject")) {
    element.setAttribute("data-wiki-component", "sisterproject");
  } else if (element.matches("math, .mwe-math-element")) {
    element.setAttribute("data-wiki-component", "math");
  } else if (element.matches(".mw-references, .mw-references-wrap")) {
    element.setAttribute("data-wiki-component", "references");
  }

  if (element instanceof HTMLElement && element.tagName === "FIGURE") classifyFigure(element, types);
}

function classifyFloatStacks(container: Element | DocumentFragment): void {
  for (const wrapper of container.querySelectorAll<HTMLElement>("div.infobox")) {
    const children = [...wrapper.children].filter((child): child is HTMLElement => child instanceof HTMLElement);
    const stackItems = children.filter(
      (child) => child.hasAttribute("data-wiki-float") || child.matches('table[data-wiki-component="infobox"], [data-wiki-component="linkbox"]'),
    );
    if (!stackItems.length) continue;
    wrapper.setAttribute("data-wiki-layout", "float-stack");
    if (!wrapper.hasAttribute("data-wiki-float")) setFloat(wrapper, "right");
    for (const child of stackItems) {
      child.setAttribute("data-wiki-stack-item", "");
      if (!child.hasAttribute("data-wiki-float")) setFloat(child, "right");
    }
  }
}

function wrapScrollableTables(container: Element | DocumentFragment): void {
  const tables = [...container.querySelectorAll<HTMLTableElement>("table")];
  for (const table of tables) {
    if (
      table.dataset.wikiComponent === "infobox" ||
      table.hasAttribute("data-wiki-float") ||
      table.parentElement?.closest('table, [data-wiki-layout="table-scroll"]') !== null
    ) {
      continue;
    }
    if (!table.hasAttribute("data-wiki-component")) table.setAttribute("data-wiki-component", "data-table");
    const wrapper = table.ownerDocument.createElement("div");
    wrapper.setAttribute("data-wiki-layout", "table-scroll");
    table.before(wrapper);
    wrapper.append(table);
  }
}

/**
 * Converts inert Parsoid layout signals into Almanpedia's owned contract.
 * The pass is deterministic, text-preserving, and safe to run more than once.
 */
export function normalizeParsoidLayout(container: Element | DocumentFragment): WikiLayoutDiagnostic[] {
  const diagnostics: WikiLayoutDiagnostic[] = [];
  const elements = [...container.querySelectorAll<HTMLElement>("*")];
  for (const element of elements) {
    const types = new Set((element.getAttribute("typeof") ?? "").split(/\s+/u).filter(Boolean));
    normalizeFloat(element);
    removeUnsafeLayout(element, diagnostics);
    classifyKnownComponent(element, types);
    element.removeAttribute("typeof");
  }
  classifyFloatStacks(container);
  wrapScrollableTables(container);
  return diagnostics;
}
