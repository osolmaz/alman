// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vitest";
import { createArticleAttribution, renderArticle, renderLanding, renderShell } from "../src/ui/views";

const MODEL_URL = "https://huggingface.co/osolmaz/GoePT-1-20M";

afterEach(() => {
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

/** Touch-only, which is what the gate asks about; see src/ui/model-gate.ts. */
function stubPhone(): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("coarse"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const PARSOID_STUB = `<html><head><title>Sapir-Whorf-Hypothese</title></head>`
  + `<body><section><p>Die Sapir-Whorf-Hypothese ist eine Annahme aus der Sprachwissenschaft.</p></section></body></html>`;

test("a phone is offered the translation instead of having the model loaded", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(PARSOID_STUB, { status: 200, headers: { "content-type": "text/html" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  stubPhone();
  const root = document.createElement("div");
  document.body.append(root);
  const shell = renderShell(root, () => {});

  await renderArticle(shell, "Sapir-Whorf-Hypothese");
  // The offer stands where translation progress would have been reported.
  const start = shell.status.querySelector<HTMLButtonElement>(".start-translation");

  expect(start?.textContent).toBe("Übersetzung starten");
  expect(shell.status.textContent).toContain("rund 34 MB");
  // The article itself is up, in German, and nothing model-shaped was requested.
  expect(shell.main.textContent).toContain("Die Sapir-Whorf-Hypothese ist eine Annahme");
  expect(fetchMock.mock.calls.every(([url]) => !String(url).includes("huggingface"))).toBe(true);
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
