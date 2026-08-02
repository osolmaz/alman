import DOMPurify from "dompurify";

/**
 * Sanitizes Parsoid article HTML before it enters our DOM. Scripts, event
 * handlers, and embedding elements are dropped; content structure (tables,
 * figures, references) survives. `<style>` blocks are dropped in v1 — some
 * template styling degrades, which is preferred over shipping foreign CSS.
 */
export function sanitizeParsoidBody(html: string): DocumentFragment {
  if (!DOMPurify.isSupported) {
    // Rendering unsanitized foreign HTML is never acceptable; fail loudly.
    throw new Error("DOMPurify is not supported in this environment");
  }
  return DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    // `typeof` is inert RDFa metadata. The layout adapter consumes the exact
    // Parsoid tokens it understands and removes the attribute before rendering.
    ADD_ATTR: ["typeof"],
    ADD_URI_SAFE_ATTR: ["typeof"],
    FORBID_TAGS: ["style", "link", "meta", "iframe", "form", "input", "button", "select", "object", "embed", "video", "audio", "base"],
    // Owned layout attributes must only be produced after sanitization. Parsoid
    // content cannot opt itself into Almanpedia component styling.
    FORBID_ATTR: [
      "srcdoc",
      "data-wiki-clear",
      "data-wiki-component",
      "data-wiki-float",
      "data-wiki-layout",
      "data-wiki-stack-item",
    ],
  });
}
