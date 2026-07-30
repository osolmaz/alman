// @vitest-environment happy-dom
import { afterEach, expect, test } from "vitest";
import { createTheater, DEMO_ARTICLE_TITLE, SCENE_DURATION_MS, type Theater } from "../src/ui/theater";

let active: Theater | null = null;

/** The scene reschedules itself on every frame, so every test has to stop it. */
function mount(): { theater: Theater; stage: HTMLElement } {
  const theater = createTheater();
  active = theater;
  document.body.append(theater.element);
  theater.start();
  return { theater, stage: theater.element.querySelector<HTMLElement>("[data-stage]")! };
}

afterEach(() => {
  active?.stop();
  active?.element.remove();
  active = null;
});

const swapStates = (stage: HTMLElement, scope: string) => {
  const swaps = [...stage.querySelectorAll<HTMLElement>(`${scope} [data-swap]`)];
  const self = [...stage.querySelectorAll<HTMLElement>(`${scope}[data-swap]`)];
  return [...swaps, ...self].map((swap) => swap.dataset.state);
};

/** Read one language layer out of a line by dropping the other one's spans. */
function layerText(line: HTMLElement, layer: "de" | "al"): string {
  const clone = line.cloneNode(true) as HTMLElement;
  const other = layer === "de" ? ".th-swap-al" : ".th-swap-de";
  for (const span of clone.querySelectorAll(other)) span.remove();
  return (clone.textContent ?? "").replace(/\s+/gu, " ").trim();
}

test("the demo article is the German Wikipedia lede on the Sapir-Whorf hypothesis", () => {
  const { stage } = mount();
  const lines = [...stage.querySelectorAll<HTMLElement>("[data-line]")];

  expect(DEMO_ARTICLE_TITLE).toBe("Sapir-Whorf-Hypothese");
  expect(stage.textContent).not.toContain("Kartoffel");
  expect(stage.querySelector(".th-page-title")?.textContent).toBe("Sapir-Whorf-Hypothese");
  expect(lines.map((line) => layerText(line, "de"))).toEqual([
    "Die Sapir-Whorf-Hypothese ist eine Annahme aus der Sprachwissenschaft, der zufolge die Sprache das Denken beeinflusst.",
    "Sie wurde posthum abgeleitet aus Schriften von Benjamin Lee Whorf, der sich wiederum auf seinen Lehrer Edward Sapir berief.",
    "Unsere Eindrücke und Erfahrungen mit der Umwelt lassen sich unterschiedlich ausdrücken.",
    "Die Hypothese versucht eine Antwort auf die Frage zu finden, ob und wie eine bestimmte Sprache mit ihren"
      + " grammatikalischen Strukturen die Welterfahrung der betreffenden Sprachgemeinschaft beeinflusst.",
  ]);
});

/**
 * Recorded from GoePT-1-20M itself, through the pinned transformers adapter over
 * the digest-verified local package, with MODEL_PACKAGE's generation parameters.
 * If the production model changes, this is expected to fail: re-record it rather
 * than hand-editing the expectation, because the figure claims to show what the
 * shipped translator does with this article.
 */
test("the Alman layer of the article is what the shipped model returns", () => {
  const { stage } = mount();
  const lines = [...stage.querySelectorAll<HTMLElement>("[data-line]")];

  expect(lines.map((line) => layerText(line, "al"))).toEqual([
    "Die Sapir-Whorf-Hypothese ist ein Annahme aus die Sprachwissenschaft, die zufolge die Sprache die Denken beeinflusst.",
    "Es wurde posthum abgeleitet aus Schriften von Benjamin Lee Whorf, die sich wiederum auf sein Lehrer Edward Sapir berief.",
    "Unser Eindrücke und Erfahrungen mit die Umwelt lassen sich unterschiedlich ausdrücken.",
    "Die Hypothese versucht ein Antwort auf die Frage zu finden, ob und wie ein bestimmte Sprache mit sein"
      + " grammatikalische Strukturen die Welterfahrung von die betreffende Sprachgemeinschaft beeinflusst.",
  ]);
});

test("each changed word carries the Alman form the specification requires", () => {
  const { stage } = mount();
  const pairs = [...stage.querySelectorAll<HTMLElement>("[data-line] [data-swap]")].map((swap) => [
    swap.querySelector(".th-swap-de")?.textContent,
    swap.querySelector(".th-swap-al")?.textContent,
  ]);

  // §1a articles, §2a indefinite, §6f relativizer, §7c possessive, §4a endings.
  expect(pairs).toContainEqual(["eine", "ein"]);
  expect(pairs).toContainEqual(["der", "die"]);
  expect(pairs).toContainEqual(["der", "die"]);
  expect(pairs).toContainEqual(["das", "die"]);
  expect(pairs).toContainEqual(["seinen", "sein"]);
  expect(pairs).toContainEqual(["Unsere", "Unser"]);
  expect(pairs).toContainEqual(["Sie", "Es"]);
  expect(pairs).toContainEqual(["ihren", "sein"]);
  expect(pairs).toContainEqual(["der", "von die"]);
  expect(pairs).toContainEqual(["grammatikalischen", "grammatikalische"]);
  expect(pairs).toContainEqual(["betreffenden", "betreffende"]);
});

test("each turnover counts its own wave, so a later one is not held back", () => {
  const { stage } = mount();
  const indexes = (selector: string) =>
    [...stage.querySelectorAll<HTMLElement>(selector)]
      .map((swap) => Number(swap.style.getPropertyValue("--swap-index")));

  // Articles turn over line by line, so each line counts from zero.
  expect(indexes('[data-line="0"] [data-kind="article"]')).toEqual([0, 1, 2]);
  expect(indexes('[data-line="2"] [data-kind="article"]')).toEqual([0]);
  expect(indexes('[data-line="3"] [data-kind="article"]')).toEqual([0, 1]);
  // The forms all turn over together, so they run as one sequence down the page.
  expect(indexes('[data-page] [data-kind="form"]')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(indexes("[data-rows] [data-swap]")).toEqual([0, 1, 2]);
  expect(indexes("[data-cards] [data-swap]")[0]).toBe(0);
});

test("the reading head marks the lines it has passed and leaves the rest alone", () => {
  const { theater, stage } = mount();
  const scans = () => [...stage.querySelectorAll<HTMLElement>("[data-line]")].map((line) => line.dataset.scan);

  theater.seekTo(25_000);
  expect(scans()).toEqual(["active", "none", "none", "none"]);

  theater.seekTo(33_000);
  expect(scans()).toEqual(["read", "read", "active", "none"]);

  theater.seekTo(41_000);
  expect(scans()).toEqual(["read", "read", "read", "read"]);
});

test("articles turn over under the reading head, one line at a time", () => {
  const { theater, stage } = mount();
  const kinds = (kind: string) =>
    [...stage.querySelectorAll<HTMLElement>(`[data-page] [data-kind="${kind}"]`)].map((swap) => swap.dataset.state);
  const lineKinds = (line: number, kind: string) =>
    [...stage.querySelectorAll<HTMLElement>(`[data-line="${line}"] [data-kind="${kind}"]`)]
      .map((swap) => swap.dataset.state);

  theater.seekTo(28_000);
  expect(lineKinds(0, "article")).toEqual(["al", "al", "al"]);
  // The head has not reached the last line, so its articles are untouched.
  expect(lineKinds(3, "article")).toEqual(["de", "de"]);

  // The last line starts at 36s and its articles have settled by 39.7s.
  theater.seekTo(40_500);
  expect(new Set(kinds("article"))).toEqual(new Set(["al"]));
});

test("nothing shakes until the whole page has been read", () => {
  const { theater, stage } = mount();
  const forms = () =>
    [...stage.querySelectorAll<HTMLElement>('[data-page] [data-kind="form"]')].map((swap) => swap.dataset.state);

  // Mid-scan: articles are already turning over, the rest is still plain German.
  theater.seekTo(35_000);
  expect(stage.dataset.hum).toBe("0");
  expect(new Set(forms())).toEqual(new Set(["de"]));

  theater.seekTo(42_000);
  expect(stage.dataset.hum).toBe("0");
  expect(new Set(forms())).toEqual(new Set(["de"]));

  theater.seekTo(46_000);
  expect(stage.dataset.hum).toBe("1");
  expect(new Set(forms())).toEqual(new Set(["hum"]));
});

test("the endings shake harder, turn over, and take the page to de-AL", () => {
  const { theater, stage } = mount();

  theater.seekTo(52_000);
  expect(stage.dataset.hum).toBe("3");

  theater.seekTo(54_000);
  expect(new Set(swapStates(stage, '[data-page] [data-kind="form"]'))).toEqual(new Set(["poof"]));
  // The language badge waits for the last word, not the first.
  expect(stage.querySelector<HTMLElement>("[data-page]")?.dataset.lang).toBe("de");

  theater.seekTo(57_000);
  expect(new Set(swapStates(stage, "[data-page]"))).toEqual(new Set(["al"]));
  expect(stage.dataset.hum).toBe("0");
  expect(stage.querySelector<HTMLElement>("[data-page]")?.dataset.lang).toBe("al");
  expect(stage.querySelector("[data-page-lang]")?.textContent).toBe("de-AL");
});

test("seeking back and forth lands on one state per moment", () => {
  const { theater, stage } = mount();
  const snapshot = () => JSON.stringify({
    act: stage.dataset.act,
    hum: stage.dataset.hum,
    stage: stage.querySelector<HTMLElement>("[data-omnibox]")?.dataset.stage,
    lang: stage.querySelector<HTMLElement>("[data-page]")?.dataset.lang,
    swaps: swapStates(stage, "[data-page]"),
    scans: [...stage.querySelectorAll<HTMLElement>("[data-line]")].map((line) => line.dataset.scan),
    cards: [...stage.querySelectorAll<HTMLElement>("[data-card]")].map((card) => card.dataset.state),
  });

  theater.seekTo(9_000);
  const early = snapshot();
  theater.seekTo(SCENE_DURATION_MS - 500);
  const late = snapshot();
  theater.seekTo(9_000);

  expect(snapshot()).toBe(early);
  expect(early).not.toBe(late);

  theater.seekTo(SCENE_DURATION_MS - 500);
  expect(snapshot()).toBe(late);
});

test("the last frame has turned over every example and shown the outro", () => {
  const { theater, stage } = mount();

  theater.seekTo(SCENE_DURATION_MS - 500);

  expect(new Set(swapStates(stage, "[data-page]"))).toEqual(new Set(["al"]));
  expect(new Set(swapStates(stage, "[data-rows]"))).toEqual(new Set(["al"]));
  expect(new Set(swapStates(stage, "[data-cards]"))).toEqual(new Set(["al"]));
  expect([...stage.querySelectorAll<HTMLElement>("[data-card]")].every((card) => card.dataset.state === "al")).toBe(true);
  expect(stage.querySelector("[data-outro]")?.classList.contains("is-in")).toBe(true);
});

test("the figure is hidden from assistive technology while its transport stays usable", () => {
  const { theater, stage } = mount();

  expect(stage.getAttribute("aria-hidden")).toBe("true");
  expect(stage.querySelector("a, button, input")).toBeNull();

  const transport = theater.element.querySelector(".th-transport")!;
  expect(transport.closest("[aria-hidden]")).toBeNull();
  expect(transport.querySelector(".th-play")?.getAttribute("aria-label")).toBeTruthy();
  expect(transport.querySelector(".th-seek")?.getAttribute("aria-label")).toBeTruthy();
  expect([...transport.querySelectorAll(".th-chapter")].map((mark) => mark.textContent))
    .toEqual(["Start", "Adresse", "Artikel", "Ein Artikel", "Beispiele", "Endungen"]);
});

/**
 * Surface forms Alman eliminates. Mirrors the benchmark linter in
 * `alman/bench/scoring.py`; mentions inside „…“ are quotations of Standard
 * German rather than uses of it, exactly as that linter treats them.
 */
const ELIMINATED = new Set([
  "den", "dem", "des",
  "eine", "einen", "einem", "eines",
  "keine", "keinen", "keinem", "keiner", "keines",
  "am", "ans", "aufs", "beim", "durchs", "fürs", "hinters", "im", "ins", "übers", "ums", "unters", "vom", "zum", "zur",
  "meine", "meinen", "meinem", "meiner", "meines",
  "seine", "seinen", "seinem", "seines",
  "ihre", "ihren", "ihrem", "ihres",
  "unsere", "unseren", "unserem", "unserer", "unseres",
  "dieser", "diesen", "diesem", "dieses",
  "jeder", "jeden", "jedem", "jedes",
  "welcher", "welchen", "welchem", "welches",
]);

function eliminatedForms(text: string): string[] {
  const uses = text.replaceAll(/„[^“]*“/gu, " ");
  return [...uses.matchAll(/[A-Za-zÄÖÜäöüß]+/gu)]
    .map((match) => match[0])
    .filter((token) => ELIMINATED.has(token.toLowerCase()));
}

test("the linter used here agrees with the benchmark linter on a known pair", () => {
  expect(eliminatedForms("Ich sehe meinen Hund in dem Haus.")).toEqual(["meinen", "dem"]);
  expect(eliminatedForms("Ich sehe mein Hund in die Haus.")).toEqual([]);
  // A mention of Standard German is not a use of it.
  expect(eliminatedForms("Verschmelzungen wie „ins“ werden aufgelöst.")).toEqual([]);
});

test("every Alman sentence the figure shows avoids the forms the dialect eliminates", () => {
  const { theater, stage } = mount();
  const caption = stage.querySelector<HTMLElement>("[data-caption]")!;
  const captions = new Set<string>();

  for (let t = 0; t < SCENE_DURATION_MS; t += 250) {
    theater.seekTo(t);
    const text = caption.textContent?.trim();
    if (text) captions.add(text);
  }

  // Enough distinct captions that the sweep is really covering the narration.
  expect(captions.size).toBeGreaterThanOrEqual(20);
  for (const text of captions) expect(eliminatedForms(text), text).toEqual([]);

  theater.seekTo(SCENE_DURATION_MS - 500);
  for (const note of stage.querySelectorAll<HTMLElement>(".th-card-note")) {
    expect(eliminatedForms(note.textContent ?? ""), note.textContent ?? "").toEqual([]);
  }
  for (const swap of stage.querySelectorAll<HTMLElement>(".th-swap-al")) {
    expect(eliminatedForms(swap.textContent ?? ""), swap.textContent ?? "").toEqual([]);
  }
});
