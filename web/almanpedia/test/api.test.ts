// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vitest";
import {
  canonicalArticleTitle,
  fetchArticleHtml,
} from "../src/wiki/api";

const directHtml = `<!doctype html><html><head>
  <title>Direkter Artikel</title>
  <link rel="dc:isVersionOf" href="//de.wikipedia.org/wiki/Direkter_Artikel">
</head><body></body></html>`;

const redirectHtml = `<!doctype html><html><head>
  <title>Physiokratie</title>
  <link rel="dc:isVersionOf" href="//de.wikipedia.org/wiki/Physiokratie">
</head><body></body></html>`;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("canonical title comes from Parsoid metadata instead of REST path layout", () => {
  expect(canonicalArticleTitle(
    directHtml,
    "https://de.wikipedia.org/api/rest_v1/page/html/Direkter_Artikel",
    "Direkter_Artikel",
  )).toBe("Direkter_Artikel");
  expect(canonicalArticleTitle(
    redirectHtml,
    "https://de.wikipedia.org/w/rest.php/v1/page/Physiokratie/html?redirect=no",
    "Physiokrat",
  )).toBe("Physiokratie");
});

test("explicit legacy and current REST shapes are safe metadata fallbacks", () => {
  expect(canonicalArticleTitle(
    "<html><body>Kein Kopf</body></html>",
    "https://de.wikipedia.org/api/rest_v1/page/html/Alte_Form",
    "Anfrage",
  )).toBe("Alte_Form");
  expect(canonicalArticleTitle(
    "<html><body>Kein Kopf</body></html>",
    "https://de.wikipedia.org/w/rest.php/v1/page/Neue_Form/html?redirect=no",
    "Anfrage",
  )).toBe("Neue_Form");
  expect(canonicalArticleTitle(
    "<html><body>Kein Kopf</body></html>",
    "https://de.wikipedia.org/unbekannt/html",
    "Sichere_Anfrage",
  )).toBe("Sichere_Anfrage");
});

test("fetchArticleHtml resolves redirected aliases without returning html as the title", async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    url: "https://de.wikipedia.org/w/rest.php/v1/page/Physiokratie/html?redirect=no",
    text: async () => redirectHtml,
  });
  vi.stubGlobal("fetch", fetch);

  const controller = new AbortController();
  const article = await fetchArticleHtml("Physiokrat", controller.signal);

  expect(article.title).toBe("Physiokratie");
  expect(article.html).toBe(redirectHtml);
  expect(fetch).toHaveBeenCalledWith(
    "https://de.wikipedia.org/api/rest_v1/page/html/Physiokrat",
    expect.objectContaining({ redirect: "follow", signal: controller.signal }),
  );
});
