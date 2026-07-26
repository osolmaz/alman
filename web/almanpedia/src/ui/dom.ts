/** Namespace cloned ids and the local references that point to them. */
export function namespaceIds(root: Element, prefix: string): void {
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
    if (href?.startsWith("#")) {
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
