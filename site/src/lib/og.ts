import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { localeNames, ui } from "../i18n/ui";
import type { MarkdownDoc } from "./markdown-endpoints";

const FONT_DIR = path.resolve("node_modules/@fontsource/barlow-semi-condensed/files");
const fonts = [
  {
    name: "Barlow Semi Condensed",
    weight: 500 as const,
    style: "normal" as const,
    data: fs.readFileSync(
      path.join(FONT_DIR, "barlow-semi-condensed-latin-500-normal.woff"),
    ),
  },
  {
    name: "Barlow Semi Condensed",
    weight: 600 as const,
    style: "normal" as const,
    data: fs.readFileSync(
      path.join(FONT_DIR, "barlow-semi-condensed-latin-600-normal.woff"),
    ),
  },
];

const imageDataUri = (file: string): string => {
  const source = fs.readFileSync(path.resolve(file));
  return `data:image/svg+xml;base64,${source.toString("base64")}`;
};

const LOCKUP = imageDataUri("public/assets/brand/alman_institut_lockup.svg");

export interface OgCard {
  title: string;
  kicker: string;
  locale: string;
  path: string;
  date?: string;
}

const element = (
  type: string,
  style: Record<string, unknown>,
  children: unknown,
): unknown => ({ type, props: { style, children } });

export function docOgCard(doc: MarkdownDoc): OgCard {
  const kicker =
    doc.section === "benchmark"
      ? "AlmanBench"
      : doc.section === "specification"
        ? ui[doc.locale]["nav.spec"]
        : doc.section === "about"
          ? ui[doc.locale]["nav.about"]
          : ui[doc.locale]["nav.blog"];
  return {
    title: doc.title,
    kicker,
    locale: localeNames[doc.locale],
    path: doc.url,
    date: doc.date?.toISOString().slice(0, 10),
  };
}

export async function renderOgCard(card: OgCard): Promise<Buffer> {
  const titleSize =
    card.title.length > 88 ? 50 : card.title.length > 58 ? 58 : card.title.length > 34 ? 68 : 78;
  const tree = element(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#fafaf8",
      color: "#1a1a1a",
      fontFamily: "Barlow Semi Condensed",
      border: "12px solid #1f4e9b",
    },
    [
      element(
        "div",
        { width: "100%", height: "8px", display: "flex" },
        [
          element("div", { width: "33.333%", height: "8px", backgroundColor: "#1a1a1a" }, ""),
          element("div", { width: "33.333%", height: "8px", backgroundColor: "#b3261e" }, ""),
          element("div", { width: "33.334%", height: "8px", backgroundColor: "#d6a900" }, ""),
        ],
      ),
      element(
        "div",
        {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "46px 56px 42px",
        },
        [
          element(
            "div",
            {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "30px",
              borderBottom: "2px solid #1a1a1a",
            },
            [
              {
                type: "img",
                props: {
                  src: LOCKUP,
                  width: 350,
                  height: 60,
                  style: { width: "350px", height: "60px" },
                },
              },
              element(
                "div",
                {
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#1f4e9b",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                },
                card.locale,
              ),
            ],
          ),
          element(
            "div",
            {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "28px 0 30px",
            },
            [
              element(
                "div",
                {
                  display: "flex",
                  marginBottom: "16px",
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#1f4e9b",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                },
                card.kicker,
              ),
              element(
                "div",
                {
                  display: "flex",
                  maxWidth: "1040px",
                  fontSize: titleSize,
                  fontWeight: 600,
                  lineHeight: 1.05,
                  letterSpacing: "-0.015em",
                  lineClamp: 3,
                },
                card.title,
              ),
            ],
          ),
          element(
            "div",
            {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "22px",
              borderTop: "1px solid #6b6b6b",
              fontSize: 24,
              color: "#6b6b6b",
              letterSpacing: "0.02em",
            },
            [
              element("div", { display: "flex" }, `alman.ai${card.path}`),
              element("div", { display: "flex" }, card.date ?? ""),
            ],
          ),
        ],
      ),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts,
  });
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng(),
  );
}
