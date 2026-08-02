// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vitest";
import { createArticleAttribution, renderArticle, renderLanding, renderShell } from "../src/ui/views";

const MODEL_URL = "https://huggingface.co/osolmaz/GoePT-1-20M";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

test("article attribution links the model without exposing its revision", () => {
  const attribution = createArticleAttribution("Liste_der_Kaiser_von_Äthiopien");

  expect(attribution.getAttribute("translate")).toBe("no");
  expect(attribution.lang).toBe("de");
  expect(attribution.textContent).toContain("Automatisch übersetzt durch GoePT-1-20M; Fehler vorbehalten.");
  expect(attribution.textContent).not.toMatch(/\b[0-9a-f]{7,40}\b/u);
  expect(attribution.querySelector<HTMLAnchorElement>(`a[href="${MODEL_URL}"]`)?.textContent).toBe("GoePT-1-20M");
  expect(attribution.querySelector<HTMLAnchorElement>('a[href="https://alman.ai/"]')?.textContent).toBe("alman.ai");
  expect(attribution.textContent).toContain("steht als Bearbeitung unter derselben Lizenz");
});

test("article pages use their specific attribution instead of the general footer", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  const root = document.createElement("div");
  document.body.append(root);
  const shell = renderShell(root, () => {});

  expect(shell.footer.hidden).toBe(false);
  expect(shell.footer.querySelector<HTMLAnchorElement>(`a[href="${MODEL_URL}"]`)?.textContent).toBe("GoePT-1-20M");
  expect(shell.footer.textContent).not.toMatch(/\b[0-9a-f]{7,40}\b/u);

  await renderArticle(shell, "Kartoffel");
  expect(shell.footer.hidden).toBe(true);

  await renderLanding(shell);
  expect(shell.footer.hidden).toBe(false);
});

const PARSOID_STUB = `<html><head><title>Sapir-Whorf-Hypothese</title></head>`
  + `<body><section><p>Die Sapir-Whorf-Hypothese ist eine Annahme aus der Sprachwissenschaft.</p></section></body></html>`;

test("an article refuses on a browser the model has killed, and fetches nothing", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(PARSOID_STUB, { status: 200, headers: { "content-type": "text/html" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const root = document.createElement("div");
  document.body.append(root);
  // What a memory kill leaves behind in the tab it killed: an attempt that
  // pagehide never cleared.
  sessionStorage.setItem("almanpedia:model-attempt:v2", String(Date.now()));
  const shell = renderShell(root, () => {});

  await renderArticle(shell, "Sapir-Whorf-Hypothese");

  expect(shell.main.querySelector(".unsupported h1")?.textContent)
    .toBe("Diese Browser hat kein Speicher für die Übersetzung");
  expect(shell.main.textContent).toContain("auf ein Computer");
  // It does not serve the Standard German article as if that were the product.
  expect(shell.main.querySelector(".wiki-content")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(shell.main.querySelector<HTMLAnchorElement>(".unsupported-links a")?.href)
    .toBe("https://de.wikipedia.org/wiki/Sapir-Whorf-Hypothese");
});

test("the landing page keeps the figure but refuses the feed on such a browser", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(PARSOID_STUB, { status: 200, headers: { "content-type": "text/html" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const root = document.createElement("div");
  document.body.append(root);
  sessionStorage.setItem("almanpedia:model-attempt:v2", String(Date.now()));
  const shell = renderShell(root, () => {});

  await renderLanding(shell);

  // The figure explains Alman without a model, so it stays.
  expect(shell.main.querySelector("[data-theater]")).not.toBeNull();
  expect(shell.main.querySelector(".unsupported")).not.toBeNull();
  expect(shell.main.querySelector(".landing-feed")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("the landing page opens on the figure under one text heading", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  const root = document.createElement("div");
  document.body.append(root);
  const shell = renderShell(root, () => {});

  await renderLanding(shell);
  const landing = shell.main.querySelector(".landing")!;

  expect(shell.main.querySelectorAll("h1")).toHaveLength(1);
  expect(shell.main.querySelector("h1")?.className).toBe("sr-only");
  // The figure stands first, where the large brand used to.
  expect([...landing.children].map((child) => child.className))
    .toEqual(["sr-only", "th-theater", "landing-intro", "shortcut-guide", "landing-feed-heading", "landing-feed wiki-content"]);
  expect(landing.querySelector(".landing-brand")).toBeNull();
});

test("an article offers its three views as a strip, with one of them current", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(PARSOID_STUB, { status: 200, headers: { "content-type": "text/html" } }),
  ));
  const root = document.createElement("div");
  document.body.append(root);
  const shell = renderShell(root, () => {});

  await renderArticle(shell, "Sapir-Whorf-Hypothese");
  const strip = shell.main.querySelector('[role="group"][aria-label="Ansicht"]')!;
  const tabs = [...strip.querySelectorAll<HTMLButtonElement>(".article-view")];

  expect(tabs.map((tab) => tab.textContent)).toEqual(["Alman", "Original", "Änderungen"]);
  // Exactly one is current, and it is the translated reading by default.
  expect(tabs.map((tab) => tab.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
  expect(tabs.filter((tab) => tab.getAttribute("aria-pressed") === "true")).toHaveLength(1);
});
