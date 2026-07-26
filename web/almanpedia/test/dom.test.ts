// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { namespaceIds } from "../src/ui/dom";

test("namespaceIds makes cloned ids unique and rewrites local references", () => {
  const root = document.createElement("article");
  root.innerHTML = `
    <h2 id="history">History</h2>
    <a href="#history" aria-describedby="note">Jump</a>
    <span id="note">One</span>
    <span id="note">Two</span>
    <label for="field">Field</label><input id="field">
  `;

  namespaceIds(root, "diff-");

  expect(Array.from(root.querySelectorAll("[id]"), (element) => element.id)).toEqual([
    "diff-history",
    "diff-note",
    "diff-note-2",
    "diff-field",
  ]);
  expect(root.querySelector("a")?.getAttribute("href")).toBe("#diff-history");
  expect(root.querySelector("a")?.getAttribute("aria-describedby")).toBe("diff-note");
  expect(root.querySelector("label")?.getAttribute("for")).toBe("diff-field");
});

test("namespaceIds can preserve canonical fragment URLs", () => {
  const root = document.createElement("article");
  root.innerHTML = `<h2 id="Geschichte">Geschichte</h2><a href="#Geschichte">Jump</a>`;

  const ids = namespaceIds(root, "diff-", { rewriteFragmentLinks: false });

  expect(ids.get("Geschichte")).toBe("diff-Geschichte");
  expect(root.querySelector("h2")?.id).toBe("diff-Geschichte");
  expect(root.querySelector("a")?.getAttribute("href")).toBe("#Geschichte");
});
