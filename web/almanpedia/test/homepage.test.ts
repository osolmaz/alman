// @vitest-environment happy-dom
import { expect, test } from "vitest";
import {
  arrangeWikipediaMainPageSections,
  createLandingIntroduction,
  extractWikipediaMainPageSections,
} from "../src/ui/homepage";

test("landing introduction explains Alman AI and the self-study audience", () => {
  const introduction = createLandingIntroduction();

  expect(introduction.querySelector("h2")?.textContent).toBe("Willkommen bei Almanpedia");
  expect(introduction.textContent).toContain("Selbstlern-Website von Alman AI");
  expect(introduction.textContent).toContain("ohne für jede Substantiv die grammatische Geschlecht auswendig lernen zu müssen");
  expect(introduction.textContent).toContain("ein vereinfachte deutsche Dialekt");
  expect(introduction.querySelector('a[href="/wiki/Kartoffel"][data-route]')?.textContent).toBe("Beispielartikel lesen");
  expect(introduction.querySelector('a[href="https://alman.ai/al/"]')?.textContent).toBe("Alman-Spezifikation");
});

test("German Wikipedia main page sections omit its welcome box and upward links", () => {
  const template = document.createElement("template");
  template.innerHTML = `
    <div class="hauptseite-box" id="willkommen"><h2>Willkommen bei Wikipedia</h2></div>
    <div class="hauptseite-box" id="artikel">
      <h2>Artikel des Tages <span class="hauptseite-upward">Nach oben</span></h2>
      <p>Heute vorgestellt</p>
    </div>
    <div class="hauptseite-box" id="ereignisse"><h2>Was geschah?</h2></div>
  `;

  const sections = extractWikipediaMainPageSections(template.content);

  expect(sections.map((section) => section.id)).toEqual(["artikel", "ereignisse"]);
  expect(sections[0]?.querySelector(".hauptseite-upward")).toBeNull();
});

test("German Wikipedia main page sections follow its independent desktop columns", () => {
  const ids = ["artikel", "ereignisse", "nachrichten", "verstorbene", "wissenswertes", "schwesterprojekte"];
  const sections = ids.map((id) => Object.assign(document.createElement("section"), { id }));

  const layout = arrangeWikipediaMainPageSections(sections);

  expect(Array.from(layout[0]?.children ?? [], (section) => section.id)).toEqual(["artikel", "nachrichten", "wissenswertes"]);
  expect(Array.from(layout[1]?.children ?? [], (section) => section.id)).toEqual(["ereignisse", "verstorbene"]);
  expect(layout[2]?.id).toBe("schwesterprojekte");
});

test("German Wikipedia main page extraction rejects an unexpected response", () => {
  expect(() => extractWikipediaMainPageSections(document.createDocumentFragment())).toThrow(
    "Wikipedia main page did not contain any content sections",
  );
});
