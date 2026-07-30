import { el } from "./dom";

const POTATO_SRC = "/brand/almanpedia-potato-192.png";
const POTATO_SRCSET = [
  "/brand/almanpedia-potato-96.png 96w",
  "/brand/almanpedia-potato-192.png 192w",
  "/brand/almanpedia-potato-384.png 384w",
  "/brand/almanpedia-potato.png 973w",
].join(", ");
const WORDMARK_SRC = "/brand/almanpedia-wordmark.svg";
const WORDMARK_ALT = "ALMANPEDIA – Die freie Enzyklopädie, vereinfacht";

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
    alt: WORDMARK_ALT,
    width: "5477",
    height: "1305",
  });
}

export function createHeaderBrand(): HTMLAnchorElement {
  return el(
    "a",
    { href: "/", "data-route": "", class: "brand brand-horizontal" },
    [potatoImage("60px"), wordmarkImage()],
  );
}

/**
 * The landing page's heading. The brand at full size is the opening act of the
 * staged figure, which is hidden from assistive technology, so the page states
 * its title here instead of repeating the mark above the figure.
 */
export function createLandingHeading(): HTMLHeadingElement {
  return el("h1", { class: "sr-only" }, [WORDMARK_ALT.replace(" – ", " — ")]);
}
