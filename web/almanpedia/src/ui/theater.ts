/**
 * The landing page's staged figure: six acts on one seekable clock.
 *
 * Act 1  the brand appears while the model loads, then clears the stage
 * Act 2  four letters of a real Wikipedia address change, and the page opens
 * Act 3  a scanner reads the article, the parts that change start to shake,
 *        and they all turn over at once
 * Act 4  the five definite article forms of Standard German converge on die
 * Act 5  three noun phrases take the same article
 * Act 6  the ending rules, one card at a time
 *
 * The timeline lives in `./scene`; see its header for the two rules every cue
 * here has to obey. The article text is the real lede of the German Wikipedia
 * article on the Sapir-Whorf hypothesis, with the Alman form of every word that
 * changes recorded beside it.
 */
import { el } from "./dom";
import { createScene, createTransport, type Chapter, type Cue } from "./scene";

export const DEMO_ARTICLE_TITLE = "Sapir-Whorf-Hypothese";
export const DEMO_ARTICLE_PATH = `/wiki/${DEMO_ARTICLE_TITLE}`;
/**
 * Long, deliberately. Every caption is a sentence a visitor has to be able to
 * finish reading before the next one replaces it, and the article act has to
 * read four sentences at a pace a learner can follow. The speed control goes to
 * 2× and the chapter markers skip, for anyone who would rather not wait.
 */
export const SCENE_DURATION_MS = 116_000;

const WORDMARK_SRC = "/brand/almanpedia-wordmark.svg";
const EMBLEM_SRC = "/brand/almanpedia-potato-192.png";

/**
 * A word that differs between Standard German and Alman.
 *
 * The two kinds turn over at different times in the article act. An `article`
 * changes under the reading head, as soon as the line is read, because that is
 * the rule a visitor can follow at a glance. A `form` — an ending, a possessive,
 * the relativizer — waits until the whole page has been read, then shakes and
 * turns over with the rest, which keeps the subtler changes together.
 */
interface Swap {
  de: string;
  al: string;
  kind: "article" | "form";
}

type Piece = string | Swap;

const article = (de: string, al: string): Swap => ({ de, al, kind: "article" });
const form = (de: string, al: string): Swap => ({ de, al, kind: "form" });
/** Acts 5 and 6 have one turnover, so their swaps take the article timing. */
const swap = article;

/**
 * The lede of https://de.wikipedia.org/wiki/Sapir-Whorf-Hypothese, shortened to
 * four sentences. Every Swap is the Alman form required by the specification:
 * §1a for the definite articles, §2a for eine, §6f for the relativizer, §7c for
 * the possessive determiners, §4a for the adjective endings.
 */
const ARTICLE_LINES: Piece[][] = [
  [
    "Die Sapir-Whorf-Hypothese ist ",
    article("eine", "ein"),
    " Annahme aus ",
    article("der", "die"),
    " Sprachwissenschaft, ",
    form("der", "das"),
    " zufolge die Sprache ",
    article("das", "die"),
    " Denken beeinflusst.",
  ],
  [
    "Sie wurde posthum abgeleitet aus Schriften von Benjamin Lee Whorf, ",
    form("der", "das"),
    " sich wiederum auf ",
    form("seinen", "sein"),
    " Lehrer Edward Sapir berief.",
  ],
  [
    form("Unsere", "Unser"),
    " Eindrücke und Erfahrungen mit ",
    article("der", "die"),
    " Umwelt lassen sich unterschiedlich ausdrücken.",
  ],
  [
    "Die Hypothese versucht ",
    article("eine", "ein"),
    " Antwort auf die Frage zu finden, ob und wie ",
    article("eine", "ein"),
    " bestimmte Sprache mit ",
    form("ihren", "ihr"),
    " ",
    form("grammatikalischen", "grammatikalische"),
    " Strukturen die Welterfahrung der ",
    form("betreffenden", "betreffende"),
    " Sprachgemeinschaft beeinflusst.",
  ],
];

/** The definite article forms that collapse, and the one that survives. */
const ARTICLE_FORMS = ["der", "die", "das", "den", "dem"];

/** Act 5: the same article in front of three different nouns. */
const PHRASE_ROWS: Piece[][] = [
  [swap("der", "die"), " Mann"],
  [swap("die", "die"), " Frau"],
  [swap("das", "die"), " Kind"],
];

/** A word whose ending falls away, changes, or appears. */
interface Ending {
  stem: string;
  drop?: string;
  add?: string;
}

type CardPiece = string | Swap | Ending;

interface RuleCard {
  rule: string;
  pieces: CardPiece[];
  note: string;
}

const RULE_CARDS: RuleCard[] = [
  {
    rule: "§10",
    pieces: [swap("die", "die"), " ", { stem: "Lehrer", drop: "in" }],
    note: "Die Suffix -in fällt weg. Ein Form für alle Person.",
  },
  {
    rule: "§4a",
    pieces: ["ein ", { stem: "gut", drop: "er", add: "e" }, " Mann"],
    note: "Jede Adjektivendung wird -e.",
  },
  {
    rule: "§1b",
    pieces: [swap("des", "der"), " ", { stem: "Hund", drop: "es" }],
    note: "In die Genitiv bleibt der, die Endung fällt weg.",
  },
  {
    rule: "§3a",
    pieces: ["mit ", swap("den", "die"), " ", { stem: "Kinder", drop: "n" }],
    note: "Kein Dativ-n in die Plural.",
  },
  {
    rule: "§1f",
    pieces: [swap("ins", "in die"), " Kino"],
    note: "Verschmelzungen wie „ins“ werden aufgelöst.",
  },
  {
    rule: "§3f",
    pieces: [swap("die", "die"), " ", { stem: "Computer", add: "s" }],
    note: "Ein -s hilft, wenn Singular und Plural gleich sind.",
  },
];

const CHAPTERS: Chapter[] = [
  { t: 0, label: "Start" },
  { t: 7_000, label: "Adresse" },
  { t: 23_000, label: "Artikel" },
  { t: 63_000, label: "Ein Artikel" },
  { t: 76_500, label: "Beispiele" },
  { t: 89_000, label: "Endungen" },
];

interface Counter {
  count: number;
}

/** One counter per set of words that turns over together. */
type Orders = Record<Swap["kind"], Counter>;

const orders = (): Orders => ({ article: { count: 0 }, form: { count: 0 } });

/**
 * Swaps carry their position within their own turnover, so each one reads as a
 * wave across those words rather than one flash, and a later turnover does not
 * inherit the delay of an earlier one.
 */
function swapElement(value: Swap, order: Orders): HTMLElement {
  const element = el("span", {
    class: "th-swap",
    "data-swap": "",
    "data-kind": value.kind,
    "data-state": "de",
  }, [
    el("span", { class: "th-swap-de" }, [value.de]),
    el("span", { class: "th-swap-al" }, [value.al]),
  ]);
  element.style.setProperty("--swap-index", String(order[value.kind].count++));
  if (value.de === value.al) element.dataset.same = "";
  return element;
}

function renderPieces(pieces: Piece[], order: Orders): Node[] {
  return pieces.map((piece) => (typeof piece === "string" ? document.createTextNode(piece) : swapElement(piece, order)));
}

function endingElement(ending: Ending): HTMLElement {
  const parts = [
    ...(ending.drop ? [el("span", { class: "th-drop" }, [ending.drop])] : []),
    ...(ending.add ? [el("span", { class: "th-add" }, [ending.add])] : []),
  ];
  // The ending gets a cell of its own, wide enough for either spelling and never
  // resized, so nothing in the phrase moves when the letters fall away or arrive.
  // Where an ending only falls away, the reserved space ends up as trailing
  // whitespace in a left-aligned phrase, which is invisible.
  return el("span", { class: "th-word" }, [ending.stem, el("span", { class: "th-ending" }, parts)]);
}

function ruleCard(card: RuleCard, order: Orders): HTMLElement {
  const phrase = el("p", { class: "th-card-phrase" }, card.pieces.map((piece) => {
    if (typeof piece === "string") return document.createTextNode(piece);
    return "stem" in piece ? endingElement(piece) : swapElement(piece, order);
  }));
  return el("div", { class: "th-card", "data-card": "", "data-state": "de" }, [
    el("span", { class: "th-card-rule" }, [card.rule]),
    phrase,
    el("p", { class: "th-card-note" }, [card.note]),
  ]);
}

function brandEmblem(className: string): HTMLImageElement {
  return el("img", {
    class: className,
    src: EMBLEM_SRC,
    width: "973",
    height: "717",
    alt: "",
    decoding: "async",
  });
}

function wordmark(className: string): HTMLImageElement {
  return el("img", { class: className, src: WORDMARK_SRC, width: "5477", height: "1305", alt: "" });
}

function buildStage(): HTMLElement {
  // Each set of words that turns over together counts from zero: one counter per
  // article line, one shared counter for the forms that all turn over at the end.
  const pageOrder = orders();
  const lineOrder = () => ({ article: { count: 0 }, form: pageOrder.form });
  const rowOrder = orders();

  const logo = el("div", { class: "th-logo", "data-logo": "" }, [
    brandEmblem("th-logo-emblem"),
    wordmark("th-logo-wordmark"),
    el("div", { class: "th-boot", "data-boot": "", "data-state": "idle" }, [el("i")]),
  ]);

  const address = (stage: string, children: Array<Node | string>) =>
    el("span", { class: "th-url", "data-url-stage": stage }, children);

  const browser = el("div", { class: "th-browser", "data-browser": "" }, [
    el("div", { class: "th-chrome" }, [
      el("span", { class: "th-lights" }, [el("i"), el("i"), el("i")]),
      el("div", { class: "th-omnibox", "data-omnibox": "", "data-stage": "start" }, [
        address("start", [`de.wikipedia.org/wiki/${DEMO_ARTICLE_TITLE}`]),
        address("select", [
          "de.",
          el("span", { class: "th-url-select" }, ["wiki"]),
          `pedia.org/wiki/${DEMO_ARTICLE_TITLE}`,
        ]),
        address("type", [
          "de.",
          el("span", { class: "th-url-typed" }, ["alman"]),
          el("span", { class: "th-url-caret" }),
          `pedia.org/wiki/${DEMO_ARTICLE_TITLE}`,
        ]),
        address("alias", [`de.almanpedia.org/wiki/${DEMO_ARTICLE_TITLE}`]),
        address("final", [`almanpedia.org/wiki/${DEMO_ARTICLE_TITLE}`]),
        el("kbd", { class: "th-enter", "data-enter": "" }, ["↵"]),
      ]),
      el("span", { class: "th-load", "data-load": "", "data-state": "idle" }),
    ]),
    el("div", { class: "th-viewport" }, [
      el("div", { class: "th-page", "data-page": "", "data-lang": "de" }, [
        el("div", { class: "th-page-head" }, [
          wordmark("th-page-wordmark"),
          el("span", { class: "th-page-lang", "data-page-lang": "" }, ["de"]),
        ]),
        el("h3", { class: "th-page-title" }, [DEMO_ARTICLE_TITLE]),
        ...ARTICLE_LINES.map((line, index) =>
          el("p", { class: "th-line", "data-line": String(index), "data-scan": "none" },
            renderPieces(line, lineOrder())),
        ),
      ]),
    ]),
  ]);

  const unify = el("div", { class: "th-panel th-panel-unify", "data-unify": "", "data-state": "spread" }, [
    el("div", { class: "th-chips" }, [
      ...ARTICLE_FORMS.map((value, index) => {
        const chip = el("span", { class: "th-chip", "data-form": "" }, [value]);
        chip.style.setProperty("--chip-index", String(index - (ARTICLE_FORMS.length - 1) / 2));
        return chip;
      }),
      el("span", { class: "th-chip th-chip-result" }, ["die"]),
      el("span", { class: "th-chip th-chip-genitive" }, ["der"]),
    ]),
    el("p", { class: "th-chips-legend" }, ["Nominativ · Akkusativ · Dativ"]),
  ]);

  const rows = el("div", { class: "th-panel th-panel-rows", "data-rows": "" },
    PHRASE_ROWS.map((row, index) =>
      el("p", { class: "th-row", "data-row": String(index) }, renderPieces(row, rowOrder)),
    ));

  const cards = el("div", { class: "th-panel th-panel-cards", "data-cards": "" },
    RULE_CARDS.map((card) => ruleCard(card, orders())));

  // Not a control: a focusable link inside an aria-hidden stage would be a trap,
  // and the real links to the article sit in the copy beside the figure.
  const outro = el("div", { class: "th-outro", "data-outro": "" }, [
    wordmark("th-outro-wordmark"),
    el("span", { class: "th-outro-cta" }, [`almanpedia.org/wiki/${DEMO_ARTICLE_TITLE}`]),
  ]);

  return el("div", {
    class: "th-stage",
    "data-stage": "",
    "data-act": "0",
    "data-hum": "0",
    "aria-hidden": "true",
  }, [
    logo,
    browser,
    unify,
    rows,
    cards,
    outro,
    el("p", { class: "th-caption", "data-caption": "" }),
  ]);
}

export interface Theater {
  element: HTMLElement;
  /** Starts the clock. Call once the stage is in the document. */
  start(): void;
  stop(): void;
  /** Jump the running scene to one moment, as the chapter buttons do. */
  seekTo(ms: number): void;
}

/**
 * Build the figure. Nothing animates until `start` is called, because the cue
 * list measures nothing but still needs the stage in the document for the
 * autoplay observer to work.
 */
export function createTheater(): Theater {
  const stage = buildStage();
  const find = <T extends Element>(selector: string): T => stage.querySelector<T>(selector)!;

  const logo = find<HTMLElement>("[data-logo]");
  const boot = find<HTMLElement>("[data-boot]");
  const browser = find<HTMLElement>("[data-browser]");
  const omnibox = find<HTMLElement>("[data-omnibox]");
  const enter = find<HTMLElement>("[data-enter]");
  const load = find<HTMLElement>("[data-load]");
  const page = find<HTMLElement>("[data-page]");
  const pageLang = find<HTMLElement>("[data-page-lang]");
  const unify = find<HTMLElement>("[data-unify]");
  const rows = find<HTMLElement>("[data-rows]");
  const cards = find<HTMLElement>("[data-cards]");
  const outro = find<HTMLElement>("[data-outro]");
  const caption = find<HTMLElement>("[data-caption]");
  const lines = [...stage.querySelectorAll<HTMLElement>("[data-line]")];
  const rowElements = [...stage.querySelectorAll<HTMLElement>("[data-row]")];
  const cardElements = [...stage.querySelectorAll<HTMLElement>("[data-card]")];
  const pick = (scope: Element, kind: Swap["kind"]) =>
    [...scope.querySelectorAll<HTMLElement>(`[data-swap][data-kind="${kind}"]`)];
  /** Articles turn over line by line under the head; forms wait for the end. */
  const lineArticles = lines.map((line) => pick(line, "article"));
  const pageForms = pick(page, "form");

  const act = (value: string) => (stage.dataset.act = value);
  const hum = (level: string) => (stage.dataset.hum = level);
  const show = (element: HTMLElement) => element.classList.add("is-in");
  const hide = (element: HTMLElement) => element.classList.remove("is-in");
  const say = (text: string) => {
    caption.textContent = text;
    caption.classList.add("is-in");
  };
  const setSwaps = (scope: Element | HTMLElement[], state: string) => {
    const elements = Array.isArray(scope) ? scope : [...scope.querySelectorAll<HTMLElement>("[data-swap]")];
    for (const element of elements) element.dataset.state = state;
  };
  /**
   * Move the reading head to one line. Lines above it stay marked as read, which
   * is what makes a seek land on a believable frame: the state of every line
   * follows from the target line alone, with no pixel measurement anywhere.
   */
  const scanTo = (index: number) => {
    for (const [position, line] of lines.entries()) {
      line.dataset.scan = position < index ? "read" : position === index ? "active" : "none";
    }
  };

  /**
   * Cue times leave room to read. No caption is replaced inside 2.4 seconds, the
   * reading head spends four seconds on a line, and the shaking runs long enough
   * to be understood as waiting rather than as an error.
   */
  const cues: Cue[] = [
    // Act 1 — the brand, and the one-time model download. This one sits at zero
    // so the first frame is a finished picture: the figure holds it until the
    // stage is on screen, and a viewer who scrubs back to the start sees it too.
    {
      t: 0,
      fn: () => {
        act("1");
        show(logo);
        say("Almanpedia liest die deutschsprachige Wikipedia in Alman.");
      },
    },
    {
      t: 1_200,
      fn: () => {
        boot.dataset.state = "loading";
        say("Die Modell lädt ein Mal in die Browser: rund 34 MB.");
      },
    },
    {
      t: 4_600,
      fn: () => {
        boot.dataset.state = "ready";
        say("Bereit. Kein Artikeltext verlässt diese Browser.");
      },
    },
    { t: 6_400, fn: () => { hide(logo); boot.dataset.state = "ready"; } },

    // Act 2 — four letters in the address.
    {
      t: 7_000,
      fn: () => {
        act("2");
        show(browser);
        omnibox.dataset.stage = "start";
        say("Ein Artikel der deutschsprachige Wikipedia.");
      },
    },
    {
      t: 9_200,
      fn: () => {
        omnibox.dataset.stage = "select";
        say("Vier Buchstaben markieren: „wiki“.");
      },
    },
    {
      t: 11_000,
      fn: () => {
        omnibox.dataset.stage = "type";
        say("„alman“ tippen.");
      },
    },
    { t: 13_600, fn: () => show(enter) },
    {
      t: 14_300,
      fn: () => {
        hide(enter);
        omnibox.dataset.stage = "alias";
        load.dataset.state = "loading";
        say("de.almanpedia.org führt auf die gleiche Pfad.");
      },
    },
    {
      t: 16_000,
      fn: () => {
        omnibox.dataset.stage = "final";
        load.dataset.state = "done";
        show(page);
        say("Die gleiche Artikel, jetzt in Almanpedia.");
      },
    },
    { t: 17_000, fn: () => show(lines[0]!) },
    { t: 17_800, fn: () => show(lines[1]!) },
    { t: 18_600, fn: () => show(lines[2]!) },
    { t: 19_400, fn: () => show(lines[3]!) },
    { t: 20_200, fn: () => say("Die Text steht noch in Standarddeutsch.") },

    // Act 3, first half — the head reads a line and its articles turn over.
    {
      t: 23_000,
      fn: () => {
        act("3");
        say("Die Übersetzung liest die Artikel Zeile für Zeile.");
      },
    },
    ...lines.flatMap((_, index): Cue[] => {
      const at = 24_000 + index * 4_000;
      return [
        { t: at, fn: () => scanTo(index) },
        { t: at + 1_500, fn: () => setSwaps(lineArticles[index]!, "poof") },
        { t: at + 2_400, fn: () => setSwaps(lineArticles[index]!, "al") },
      ];
    }),
    { t: 26_600, fn: () => say("Jede Artikelform wechselt sofort auf die.") },
    { t: 30_600, fn: () => say("Manche Zeile hat kein Artikel, nur Endungen.") },
    {
      t: 40_000,
      fn: () => {
        scanTo(lines.length);
        say("Alles gelesen. Jede Artikelform steht jetzt in Alman.");
      },
    },

    // Act 3, second half — what is left shakes, then turns over together.
    {
      t: 44_000,
      fn: () => {
        hum("1");
        setSwaps(pageForms, "hum");
        say("Es bleiben die Endungen und die Pronomen.");
      },
    },
    { t: 47_600, fn: () => { hum("2"); say("Je länger ein Stelle wartet, desto stärker."); } },
    { t: 51_000, fn: () => hum("3") },
    {
      t: 53_000,
      fn: () => {
        hum("3");
        setSwaps(pageForms, "poof");
        say("Poof.");
      },
    },
    {
      t: 55_000,
      fn: () => {
        hum("0");
        setSwaps(pageForms, "al");
        page.dataset.lang = "al";
        pageLang.textContent = "de-AL";
        say("Fertig. Nur die Genitiv behält der.");
      },
    },
    {
      t: 59_000,
      fn: () => {
        scanTo(-1);
        say("Kein Wort ist verschwunden. Nur die Endungen sind weg.");
      },
    },

    // Act 4 — five forms, one article.
    {
      t: 63_000,
      fn: () => {
        act("4");
        hide(browser);
        show(unify);
        unify.dataset.state = "spread";
        say("Standarddeutsch hat fünf Formen für ein Artikel.");
      },
    },
    { t: 65_000, fn: () => (unify.dataset.state = "gather") },
    { t: 67_000, fn: () => (unify.dataset.state = "merge") },
    {
      t: 68_400,
      fn: () => {
        unify.dataset.state = "merged";
        say("In Alman bleibt ein Form übrig.");
      },
    },
    {
      t: 72_000,
      fn: () => {
        unify.dataset.state = "genitive";
        say("Ein Ausnahme: in die Genitiv steht der, wie in „die Haus der Mann“.");
      },
    },
    { t: 76_000, fn: () => { hide(unify); unify.dataset.state = "genitive"; } },

    // Act 5 — the same article in front of three nouns.
    {
      t: 76_500,
      fn: () => {
        act("5");
        show(rows);
        say("Drei Substantive, drei Genus in Standarddeutsch.");
      },
    },
    { t: 78_200, fn: () => show(rowElements[0]!) },
    { t: 79_200, fn: () => show(rowElements[1]!) },
    { t: 80_200, fn: () => show(rowElements[2]!) },
    { t: 81_800, fn: () => setSwaps(rows, "poof") },
    {
      t: 83_200,
      fn: () => {
        setSwaps(rows, "al");
        say("die Mann, die Frau, die Kind.");
      },
    },
    { t: 86_200, fn: () => say("Die Substantiv bleibt, wie es war.") },
    { t: 88_800, fn: () => hide(rows) },

    // Act 6 — the ending rules, one card at a time.
    {
      t: 89_000,
      fn: () => {
        act("6");
        show(cards);
        say("Die Endungen folgen wenige Regeln.");
      },
    },
    ...cardElements.flatMap((card, index): Cue[] => {
      const at = 90_500 + index * 3_000;
      return [
        { t: at, fn: () => show(card) },
        {
          t: at + 1_100,
          fn: () => {
            card.dataset.state = "al";
            setSwaps(card, "al");
          },
        },
      ];
    }),
    {
      t: 108_500,
      fn: () => say("Ein Artikel, ein Adjektivendung, kein Genusregeln."),
    },
    {
      t: 111_500,
      fn: () => {
        hide(cards);
        show(outro);
        say("Jede Artikel der deutschsprachige Wikipedia, lokal vereinfacht.");
      },
    },
  ];

  function reset(): void {
    act("0");
    hum("0");
    for (const element of [logo, browser, page, unify, rows, cards, outro, enter, caption]) hide(element);
    for (const element of [...lines, ...rowElements, ...cardElements]) hide(element);
    for (const element of cardElements) element.dataset.state = "de";
    setSwaps(stage, "de");
    boot.dataset.state = "idle";
    omnibox.dataset.stage = "start";
    load.dataset.state = "idle";
    page.dataset.lang = "de";
    pageLang.textContent = "de";
    unify.dataset.state = "spread";
    scanTo(-1);
    caption.textContent = "";
  }

  const transport = createTransport(CHAPTERS, SCENE_DURATION_MS, (ms) => scene?.seekTo(ms));
  const element = el("div", { class: "th-theater", "data-theater": "" }, [
    el("div", { class: "th-stagewrap" }, [stage]),
    transport.element,
  ]);

  let scene: ReturnType<typeof createScene> | null = null;
  let running = false;

  return {
    element,
    start() {
      if (scene) return;
      running = true;
      scene = createScene({
        root: element,
        stage,
        cues,
        durationMs: SCENE_DURATION_MS,
        reset,
        toggle: transport.toggle,
        seek: transport.seek,
        rate: transport.rate,
        onTime: transport.markCurrent,
        raf: (callback) => {
          if (running) requestAnimationFrame(callback);
        },
      });
    },
    stop() {
      running = false;
      scene?.setPlaying(false);
      scene = null;
    },
    seekTo(ms) {
      scene?.seekTo(ms);
    },
  };
}
