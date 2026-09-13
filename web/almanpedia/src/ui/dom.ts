/** Namespace cloned ids and the local references that point to them. */
export function namespaceIds(
  root: Element,
  prefix: string,
  { rewriteFragmentLinks = true }: { rewriteFragmentLinks?: boolean } = {},
): ReadonlyMap<string, string> {
  const firstId = new Map<string, string>();
  const counts = new Map<string, number>();
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("[id]"))];
  for (const element of elements) {
    const original = element.getAttribute("id");
    if (!original) continue;
    const count = counts.get(original) ?? 0;
    counts.set(original, count + 1);
    const namespaced = count === 0 ? `${prefix}${original}` : `${prefix}${original}-${count + 1}`;
    firstId.set(original, firstId.get(original) ?? namespaced);
    element.id = namespaced;
  }

  for (const element of [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))]) {
    const href = element.getAttribute("href");
    if (rewriteFragmentLinks && href?.startsWith("#")) {
      const target = firstId.get(href.slice(1));
      if (target) element.setAttribute("href", `#${target}`);
    }
    const htmlFor = element.getAttribute("for");
    if (htmlFor && firstId.has(htmlFor)) element.setAttribute("for", firstId.get(htmlFor)!);
    for (const attribute of ["aria-labelledby", "aria-describedby"]) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      element.setAttribute(
        attribute,
        value.split(/\s+/u).map((id) => firstId.get(id) ?? id).join(" "),
      );
    }
  }
  return firstId;
}

/**
 * A run of interface text, or one of the things that sits inside a run: a link,
 * external or one the router handles, or a code span. Messages are written as
 * runs so a translated sentence keeps its links in the place the language wants
 * them, rather than in the place German wanted them.
 */
export type TextPart =
  | string
  | { readonly href: string; readonly text: string; readonly external?: boolean }
  | { readonly code: string };

/** Build the children of a paragraph or a footer line from its runs. */
export function textRuns(parts: readonly TextPart[]): Array<Node | string> {
  return parts.map((part) => {
    if (typeof part === "string") return document.createTextNode(part);
    if ("code" in part) return el("code", {}, [part.code]);
    return el(
      "a",
      part.external
        ? { href: part.href, target: "_blank", rel: "noopener" }
        : { href: part.href, "data-route": "" },
      [part.text],
    );
  });
}

/** Tiny element builder; text content only, never HTML strings. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  element.append(...children);
  return element;
}
