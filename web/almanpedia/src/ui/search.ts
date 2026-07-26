import { searchSuggestions } from "../wiki/api";
import { el } from "./dom";

export function createSearchBox(navigate: (path: string) => void): HTMLElement {
  const input = el("input", {
    type: "search",
    placeholder: "Artikel suchen …",
    "aria-label": "Artikel suchen",
    autocomplete: "off",
  });
  const list = el("ul", { class: "search-suggestions", hidden: "" });
  const box = el("div", { class: "search-box" }, [input, list]);

  let debounce: ReturnType<typeof setTimeout> | undefined;
  let suggestions: string[] = [];

  function hide(): void {
    list.hidden = true;
    list.replaceChildren();
  }

  function go(title: string): void {
    hide();
    input.value = "";
    navigate(`/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`);
  }

  input.addEventListener("input", () => {
    clearTimeout(debounce);
    const query = input.value.trim();
    if (!query) {
      hide();
      return;
    }
    debounce = setTimeout(async () => {
      suggestions = await searchSuggestions(query);
      list.replaceChildren(
        ...suggestions.map((title) => {
          const item = el("li", {}, [title]);
          item.addEventListener("mousedown", (event) => {
            event.preventDefault();
            go(title);
          });
          return item;
        }),
      );
      list.hidden = suggestions.length === 0;
    }, 200);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const query = input.value.trim();
    if (!query) return;
    go(suggestions[0] ?? query);
  });

  input.addEventListener("blur", () => setTimeout(hide, 150));
  return box;
}
