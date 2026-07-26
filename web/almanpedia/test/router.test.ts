import { expect, test } from "vitest";
import { parseRoute } from "../src/router";

test("parseRoute distinguishes landing and article paths", () => {
  expect(parseRoute("/")).toEqual({ kind: "landing" });
  expect(parseRoute("/wiki/")).toEqual({ kind: "landing" });
  expect(parseRoute("/wiki/Kartoffel")).toEqual({ kind: "article", title: "Kartoffel" });
  expect(parseRoute("/wiki/Nachtschattengew%C3%A4chse")).toEqual({ kind: "article", title: "Nachtschattengewächse" });
  expect(parseRoute("/wiki/Doppelpunkt:_Ein_Artikel")).toEqual({ kind: "article", title: "Doppelpunkt:_Ein_Artikel" });
  expect(parseRoute("/wiki/Kartoffel", "#Herkunft_und_Geschichte")).toEqual({
    kind: "article",
    title: "Kartoffel",
    hash: "Herkunft_und_Geschichte",
  });
  expect(parseRoute("/wiki/Kartoffel", "#Urspr%C3%BCngliche_Herkunft")).toEqual({
    kind: "article",
    title: "Kartoffel",
    hash: "Ursprüngliche_Herkunft",
  });
});
