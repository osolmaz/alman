import { expect, test } from "vitest";
import { parseRoute } from "../src/router";

test("parseRoute distinguishes landing and article paths", () => {
  expect(parseRoute("/")).toEqual({ kind: "landing" });
  expect(parseRoute("/wiki/")).toEqual({ kind: "landing" });
  expect(parseRoute("/wiki/Kartoffel")).toEqual({ kind: "article", title: "Kartoffel" });
  expect(parseRoute("/wiki/Nachtschattengew%C3%A4chse")).toEqual({ kind: "article", title: "Nachtschattengewächse" });
  expect(parseRoute("/wiki/Doppelpunkt:_Ein_Artikel")).toEqual({ kind: "article", title: "Doppelpunkt:_Ein_Artikel" });
});
