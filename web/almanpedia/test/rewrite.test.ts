import { describe, expect, test } from "vitest";
import { rewriteArticleDom } from "../src/wiki/rewrite";
import { sanitizeParsoidBody } from "../src/wiki/sanitize";

/** Parsoid output patterns as served by /api/rest_v1/page/html/ (verified live). */
const PARSOID_FIXTURE = `
<section data-mw-section-id="0">
  <p>
    Die <a rel="mw:WikiLink" href="./Kartoffel" title="Kartoffel">Kartoffel</a> gehört zu den
    <a rel="mw:WikiLink" href="./Nachtschattengew%C3%A4chse" title="Nachtschattengewächse">Nachtschattengewächsen</a>.
    Siehe <a rel="mw:WikiLink" href="./Datei:Foo.jpg" title="Datei:Foo.jpg">Bild</a> und
    <a rel="mw:WikiLink" href="./Hilfe:Suche">Hilfe</a> sowie
    <a rel="mw:WikiLink" href="./Doppelpunkt:_Ein_Artikel" title="Doppelpunkt: Ein Artikel">Artikel mit Doppelpunkt</a>.
    Extern: <a rel="mw:ExtLink" href="https://example.org/x" class="external">Beispiel</a> und
    <a href="//example.net/y">protokollrelativ</a> und <a href="/w/index.php?title=Spezial:Suche">intern-alt</a>.
    Anker: <a href="#Abschnitt">Abschnitt</a>.
  </p>
  <figure typeof="mw:File/Thumb" data-mw='{"caption":"x"}'>
    <a href="./Datei:Potato.jpg"><img resource="./Datei:Potato.jpg"
      src="//upload.wikimedia.org/wikipedia/commons/thumb/a/a3/x.jpg/330px-x.jpg"
      srcset="//upload.wikimedia.org/wikipedia/commons/thumb/a/a3/x.jpg/500px-x.jpg 1.5x"></a>
    <figcaption>Ein Knolle</figcaption>
  </figure>
  <img src="https://evil.example.com/tracker.png">
  <p about="#mwt5">Mit about-Attribut.</p>
</section>
`;

function rewritten(): HTMLElement {
  const fragment = sanitizeParsoidBody(PARSOID_FIXTURE);
  rewriteArticleDom(fragment);
  const host = document.createElement("div");
  host.append(fragment);
  return host;
}

describe("rewriteArticleDom", () => {
  test("article links become internal almanpedia routes", () => {
    const host = rewritten();
    const kartoffel = host.querySelector('a[title="Kartoffel"]');
    expect(kartoffel?.getAttribute("href")).toBe("/wiki/Kartoffel");
    expect(kartoffel?.hasAttribute("data-internal")).toBe(true);
    const encoded = host.querySelector('a[title="Nachtschattengewächse"]');
    expect(encoded?.getAttribute("href")).toBe("/wiki/Nachtschattengew%C3%A4chse");
  });

  test("titles containing a colon stay internal unless the prefix is a namespace", () => {
    const host = rewritten();
    const colonArticle = host.querySelector('a[title="Doppelpunkt: Ein Artikel"]');
    expect(colonArticle?.getAttribute("href")).toBe("/wiki/Doppelpunkt:_Ein_Artikel");
    expect(colonArticle?.hasAttribute("data-internal")).toBe(true);
  });

  test("namespace links leave for Wikipedia in a new tab", () => {
    const host = rewritten();
    const datei = host.querySelector('a[title="Datei:Foo.jpg"]');
    expect(datei?.getAttribute("href")).toBe("https://de.wikipedia.org/wiki/Datei:Foo.jpg");
    expect(datei?.getAttribute("target")).toBe("_blank");
    expect(datei?.getAttribute("rel")).toBe("noopener");
    const hilfe = [...host.querySelectorAll("a")].find((a) => a.textContent === "Hilfe");
    expect(hilfe?.getAttribute("href")).toBe("https://de.wikipedia.org/wiki/Hilfe:Suche");
  });

  test("external, protocol-relative, root-relative, and anchor links are handled", () => {
    const host = rewritten();
    const anchors = [...host.querySelectorAll("a")];
    const external = anchors.find((a) => a.textContent === "Beispiel");
    expect(external?.getAttribute("target")).toBe("_blank");
    const protocolRelative = anchors.find((a) => a.textContent === "protokollrelativ");
    expect(protocolRelative?.getAttribute("href")).toBe("https://example.net/y");
    const rootRelative = anchors.find((a) => a.textContent === "intern-alt");
    expect(rootRelative?.getAttribute("href")).toBe("https://de.wikipedia.org/w/index.php?title=Spezial:Suche");
    const fragment = anchors.find((a) => a.textContent === "Abschnitt");
    expect(fragment?.getAttribute("href")).toBe("#Abschnitt");
    expect(fragment?.getAttribute("target")).toBeNull();
  });

  test("wikimedia media URLs are absolutized, foreign hosts removed", () => {
    const host = rewritten();
    const img = host.querySelector("figure img");
    expect(img?.getAttribute("src")).toBe("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/x.jpg/330px-x.jpg");
    expect(img?.getAttribute("srcset")).toContain("https://upload.wikimedia.org/");
    expect(host.querySelector('img[src*="evil"]')).toBeNull();
  });

  test("parsoid payload attributes are stripped", () => {
    const host = rewritten();
    expect(host.querySelector("[data-mw]")).toBeNull();
    expect(host.querySelector("[about]")).toBeNull();
  });
});

describe("sanitizeParsoidBody", () => {
  test("retains inert Parsoid type metadata for the layout adapter", () => {
    const fragment = sanitizeParsoidBody(`<figure typeof="mw:File/Thumb"><img src="//upload.wikimedia.org/x.jpg"></figure>`);
    expect(fragment.querySelector("figure")?.getAttribute("typeof")).toBe("mw:File/Thumb");
  });

  test("scripts, handlers, and embeds never survive", () => {
    const fragment = sanitizeParsoidBody(
      `<p onclick="alert(1)">Text</p><script>alert(2)</script><iframe src="https://x"></iframe>` +
        `<img src="//upload.wikimedia.org/x.jpg" onerror="alert(3)"><style>body{display:none}</style>`,
    );
    const host = document.createElement("div");
    host.append(fragment);
    expect(host.querySelector("script")).toBeNull();
    expect(host.querySelector("iframe")).toBeNull();
    expect(host.querySelector("style")).toBeNull();
    expect(host.querySelector("[onclick]")).toBeNull();
    expect(host.querySelector("[onerror]")).toBeNull();
    expect(host.querySelector("p")?.textContent).toBe("Text");
    expect(host.querySelector("img")).not.toBeNull();
  });
});
