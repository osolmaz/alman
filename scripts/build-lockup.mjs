// Generates public/assets/brand/alman_institut_lockup.svg:
// the emblem plus the two wordmark lines converted to vector paths,
// with both lines sized to exactly the same ink width.
//
// Run with: node scripts/build-lockup.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import opentype from "opentype.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BRAND = path.join(ROOT, "public/assets/brand");
const INK = "#1a1a1a";

// Layout (viewBox units). Emblem spans the full height; text sits right of it.
const H = 48;
const EMBLEM_W = (H * 222.77916) / 162.71875;
const GAP = 13;
const TEXT_X = EMBLEM_W + GAP;
const NAME_BASELINE = 24;
const SUB_BASELINE = 42;

// Starting sizes; both lines are then scaled to the midpoint of their
// natural ink widths, so the name grows and the subtitle shrinks.
const NAME = { text: "ALMAN INSTITUT", size: 26, tracking: 0.05 };
const SUB = { text: "FÜR SPRACHVEREINFACHUNG", size: 13, tracking: 0.22 };

const loadFont = (file) =>
  opentype.parse(
    readFileSync(path.join(ROOT, "scripts/fonts", file)).buffer,
  );

const semibold = loadFont("BarlowSemiCondensed-SemiBold.ttf");
const medium = loadFont("BarlowSemiCondensed-Medium.ttf");

function inkWidth(font, { text, size, tracking }) {
  const box = font
    .getPath(text, 0, 0, size, { kerning: true, letterSpacing: tracking })
    .getBoundingBox();
  return box.x2 - box.x1;
}

function linePath(font, { text, size, tracking }, baseline, targetWidth) {
  const scaled = (size * targetWidth) / inkWidth(font, { text, size, tracking });
  const probe = font
    .getPath(text, 0, baseline, scaled, { kerning: true, letterSpacing: tracking })
    .getBoundingBox();
  const p = font.getPath(text, TEXT_X - probe.x1, baseline, scaled, {
    kerning: true,
    letterSpacing: tracking,
  });
  return { d: p.toPathData(2), size: scaled };
}

const target =
  (inkWidth(semibold, NAME) + inkWidth(medium, SUB)) / 2;
const name = linePath(semibold, NAME, NAME_BASELINE, target);
const sub = linePath(medium, SUB, SUB_BASELINE, target);
console.log(
  `target width ${target.toFixed(2)}; name ${NAME.size} -> ${name.size.toFixed(2)}, sub ${SUB.size} -> ${sub.size.toFixed(2)}`,
);

// Embed the emblem, stripped of Inkscape editor metadata.
let emblem = readFileSync(
  path.join(BRAND, "alman_institut_logo.svg"),
  "utf-8",
);
emblem = emblem
  .replace(/<\?xml[^>]*\?>|<!--[\s\S]*?-->/g, "")
  .replace(/<sodipodi:namedview[\s\S]*?\/>/g, "")
  .replace(/\s(?:inkscape|sodipodi):[a-zA-Z-]+="[^"]*"/g, "")
  .replace(/\sxmlns:(?:inkscape|sodipodi)="[^"]*"/g, "")
  .replace(/style="fill:#000000;stroke-width:1"/g, `fill="${INK}"`)
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .trim();

// A scaled group instead of a nested <svg viewBox>: WebKit does not
// support viewBox on nested svg elements, which drops the emblem in Safari.
const emblemScale = H / 162.71875;
const totalWidth = Math.ceil(TEXT_X + target);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${H}" width="${totalWidth}" height="${H}">
  <g transform="scale(${emblemScale.toFixed(6)})">
    ${emblem}
  </g>
  <path fill="${INK}" d="${name.d}"/>
  <path fill="#6b6b6b" d="${sub.d}"/>
</svg>
`;

writeFileSync(path.join(BRAND, "alman_institut_lockup.svg"), svg);
console.log(`wrote alman_institut_lockup.svg (${totalWidth}x${H})`);
