import { el } from "./dom";

const POTATO_SRC = "/brand/almanpedia-potato-192.png";
const POTATO_SRCSET = [
  "/brand/almanpedia-potato-96.png 96w",
  "/brand/almanpedia-potato-192.png 192w",
  "/brand/almanpedia-potato-384.png 384w",
  "/brand/almanpedia-potato.png 973w",
].join(", ");
const WORDMARK_SRC = "/brand/almanpedia-wordmark.svg";
const TAGLINE = "Die freie Enzyklopädie, amtlich vereinfacht";

function potatoImage(sizes: string): HTMLImageElement {
  return el("img", {
    class: "brand-potato",
    src: POTATO_SRC,
    srcset: POTATO_SRCSET,
    sizes,
    width: "973",
    height: "717",
    alt: "",
    decoding: "async",
  });
}

function wordmarkImage(): HTMLImageElement {
  return el("img", {
    class: "brand-wordmark",
    src: WORDMARK_SRC,
    alt: "Almanpedia",
    width: "5244",
    height: "940",
  });
}

function brandContents(orientation: "horizontal" | "vertical"): Node[] {
  return [
    potatoImage(orientation === "horizontal" ? "60px" : "(max-width: 40rem) 160px, 220px"),
    wordmarkImage(),
    el("span", { class: "brand-sub" }, [TAGLINE]),
  ];
}

export function createHeaderBrand(): HTMLAnchorElement {
  return el(
    "a",
    { href: "/", "data-route": "", class: "brand brand-horizontal" },
    brandContents("horizontal"),
  );
}

export function createLandingBrand(): HTMLHeadingElement {
  return el("h1", { class: "brand brand-vertical landing-brand" }, brandContents("vertical"));
}
