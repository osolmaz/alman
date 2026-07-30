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
export const SCENE_DURATION_MS = 82_000;

const WORDMARK_SRC = "/brand/almanpedia-wordmark.svg";
const EMBLEM_SRC = "/brand/almanpedia-potato-192.png";

/** A word that differs between Standard German and Alman. */
interface Swap {
  de: string;
  al: string;
}

type Piece = string | Swap;

const swap = (de: string, al: string): Swap => ({ de, al });

/**
 * The lede of https://de.wikipedia.org/wiki/Sapir-Whorf-Hypothese, shortened to
 * four sentences. Every Swap is the Alman form required by the specification:
 * §1a for the definite articles, §2a for eine, §6f for the relativizer, §7c for
 * the possessive determiners, §4a for the adjective endings.
 */
const ARTICLE_LINES: Piece[][] = [
  [
    "Die Sapir-Whorf-Hypothese ist ",
    swap("eine", "ein"),
    " Annahme aus ",
    swap("der", "die"),
    " Sprachwissenschaft, ",
    swap("der", "das"),
    " zufolge die Sprache ",
    swap("das", "die"),
    " Denken beeinflusst.",
  ],
  [
    "Sie wurde posthum abgeleitet aus Schriften von Benjamin Lee Whorf, ",
    swap("der", "das"),
    " sich wiederum auf ",
    swap("seinen", "sein"),
    " Lehrer Edward Sapir berief.",
  ],
  [
    swap("Unsere", "Unser"),
    " Eindrücke und Erfahrungen mit ",
    swap("der", "die"),
    " Umwelt lassen sich unterschiedlich ausdrücken.",
  ],
  [
    "Die Hypothese versucht ",
    swap("eine", "ein"),
    " Antwort auf die Frage zu finden, ob und wie ",
    swap("eine", "ein"),
    " bestimmte Sprache mit ",
    swap("ihren", "ihr"),
    " ",
    swap("grammatikalischen", "grammatikalische"),
    " Strukturen die Welterfahrung der ",
    swap("betreffenden", "betreffende"),
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
  { t: 5_000, label: "Adresse" },
  { t: 17_000, label: "Artikel" },
  { t: 45_000, label: "Ein Artikel" },
  { t: 55_000, label: "Beispiele" },
  { t: 65_000, label: "Endungen" },
];

/**
 * Swaps carry their position within their own group, so each turnover reads as
 * a wave across that group rather than one flash, and a later group does not
 * inherit the delay of an earlier one.
 */
function swapElement(value: Swap, order: { count: number }): HTMLElement {
  const element = el("span", { class: "th-swap", "data-swap": "", "data-state": "de" }, [
    el("span", { class: "th-swap-de" }, [value.de]),
    el("span", { class: "th-swap-al" }, [value.al]),
  ]);
  element.style.setProperty("--swap-index", String(order.count++));
  if (value.de === value.al) element.dataset.same = "";
  return element;
}

function renderPieces(pieces: Piece[], order: { count: number }): Node[] {
  return pieces.map((piece) => (typeof piece === "string" ? document.createTextNode(piece) : swapElement(piece, order)));
}

function endingElement(ending: Ending): HTMLElement {
  return el("span", { class: "th-word" }, [
    ending.stem,
    ...(ending.drop ? [el("span", { class: "th-drop" }, [ending.drop])] : []),
    ...(ending.add ? [el("span", { class: "th-add" }, [ending.add])] : []),
  ]);
}

function ruleCard(card: RuleCard, order: { count: number }): HTMLElement {
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
  const articleOrder = { count: 0 };
  const rowOrder = { count: 0 };
  const cardOrder = { count: 0 };

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
            renderPieces(line, articleOrder)),
        ),
      ]),
    ]),
  ]);

  const unify = el("div", { class: "th-panel th-panel-unify", "data-unify": "", "data-state": "spread" }, [
    el("div", { class: "th-chips" }, [
      ...ARTICLE_FORMS.map((form, index) => {
        const chip = el("span", { class: "th-chip", "data-form": "" }, [form]);
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
    RULE_CARDS.map((card) => ruleCard(card, cardOrder)));

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
  const articleSwaps = lines.map((line) => [...line.querySelectorAll<HTMLElement>("[data-swap]")]);

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
      t: 1_000,
      fn: () => {
        boot.dataset.state = "loading";
        say("Die Modell lädt ein Mal in die Browser: rund 34 MB.");
      },
    },
    {
      t: 3_300,
      fn: () => {
        boot.dataset.state = "ready";
        say("Bereit. Kein Artikeltext verlässt diese Browser.");
      },
    },
    { t: 4_400, fn: () => { hide(logo); boot.dataset.state = "ready"; } },

    // Act 2 — four letters in the address.
    {
      t: 5_000,
      fn: () => {
        act("2");
        show(browser);
        omnibox.dataset.stage = "start";
        say("Ein Artikel der deutschsprachige Wikipedia.");
      },
    },
    {
      t: 6_600,
      fn: () => {
        omnibox.dataset.stage = "select";
        say("Vier Buchstaben markieren: „wiki“.");
      },
    },
    {
      t: 8_000,
      fn: () => {
        omnibox.dataset.stage = "type";
        say("„alman“ tippen.");
      },
    },
    { t: 10_400, fn: () => show(enter) },
    {
      t: 11_000,
      fn: () => {
        hide(enter);
        omnibox.dataset.stage = "alias";
        load.dataset.state = "loading";
        say("de.almanpedia.org führt auf die gleiche Pfad.");
      },
    },
    {
      t: 12_400,
      fn: () => {
        omnibox.dataset.stage = "final";
        load.dataset.state = "done";
        show(page);
        say("Die gleiche Artikel, jetzt in Almanpedia.");
      },
    },
    { t: 13_400, fn: () => show(lines[0]!) },
    { t: 14_200, fn: () => show(lines[1]!) },
    { t: 15_000, fn: () => show(lines[2]!) },
    { t: 15_800, fn: () => show(lines[3]!) },
    { t: 16_600, fn: () => say("Die Text steht noch in Standarddeutsch.") },

    // Act 3 — the scan, the shaking, and the turnover.
    {
      t: 17_000,
      fn: () => {
        act("3");
        say("Die Übersetzung liest die Artikel Zeile für Zeile.");
      },
    },
    { t: 17_800, fn: () => { scanTo(0); hum("1"); setSwaps(articleSwaps[0]!, "hum"); } },
    { t: 20_800, fn: () => { scanTo(1); hum("1"); setSwaps(articleSwaps[1]!, "hum"); } },
    { t: 23_800, fn: () => { scanTo(2); hum("1"); setSwaps(articleSwaps[2]!, "hum"); } },
    {
      t: 26_800,
      fn: () => {
        scanTo(3);
        hum("1");
        setSwaps(articleSwaps[3]!, "hum");
        say("Die Stellen, das sich ändern, fangen an zu zittern.");
      },
    },
    { t: 29_800, fn: () => { scanTo(lines.length); hum("2"); } },
    { t: 32_800, fn: () => { hum("3"); say("Je länger ein Stelle wartet, desto stärker."); } },
    {
      t: 35_300,
      fn: () => {
        hum("3");
        setSwaps(page, "poof");
        say("Poof.");
      },
    },
    {
      t: 37_600,
      fn: () => {
        hum("0");
        setSwaps(page, "al");
        page.dataset.lang = "al";
        pageLang.textContent = "de-AL";
        say("Alle Artikel sind jetzt die. Nur die Genitiv behält der.");
      },
    },
    {
      t: 41_200,
      fn: () => {
        scanTo(-1);
        say("Kein Wort ist verschwunden. Nur die Endungen sind weg.");
      },
    },

    // Act 4 — five forms, one article.
    {
      t: 45_000,
      fn: () => {
        act("4");
        hide(browser);
        show(unify);
        unify.dataset.state = "spread";
        say("Standarddeutsch hat fünf Formen für ein Artikel.");
      },
    },
    { t: 46_600, fn: () => (unify.dataset.state = "gather") },
    { t: 48_400, fn: () => (unify.dataset.state = "merge") },
    {
      t: 49_600,
      fn: () => {
        unify.dataset.state = "merged";
        say("In Alman bleibt ein Form übrig.");
      },
    },
    {
      t: 52_400,
      fn: () => {
        unify.dataset.state = "genitive";
        say("Ein Ausnahme: in die Genitiv steht der, wie in „die Haus der Mann“.");
      },
    },
    { t: 54_400, fn: () => { hide(unify); unify.dataset.state = "genitive"; } },

    // Act 5 — the same article in front of three nouns.
    {
      t: 55_000,
      fn: () => {
        act("5");
        show(rows);
        say("Drei Substantive, drei Genus in Standarddeutsch.");
      },
    },
    { t: 56_400, fn: () => show(rowElements[0]!) },
    { t: 57_200, fn: () => show(rowElements[1]!) },
    { t: 58_000, fn: () => show(rowElements[2]!) },
    { t: 59_200, fn: () => setSwaps(rows, "poof") },
    {
      t: 60_600,
      fn: () => {
        setSwaps(rows, "al");
        say("die Mann, die Frau, die Kind.");
      },
    },
    { t: 62_600, fn: () => say("Die Substantiv bleibt, wie es war.") },
    { t: 64_400, fn: () => hide(rows) },

    // Act 6 — the ending rules.
    {
      t: 65_000,
      fn: () => {
        act("6");
        show(cards);
        say("Die Endungen folgen wenige Regeln.");
      },
    },
    ...cardElements.flatMap((card, index): Cue[] => {
      const at = 66_200 + index * 2_100;
      return [
        { t: at, fn: () => show(card) },
        {
          t: at + 900,
          fn: () => {
            card.dataset.state = "al";
            setSwaps(card, "al");
          },
        },
      ];
    }),
    {
      t: 79_000,
      fn: () => say("Ein Artikel, ein Adjektivendung, kein Genusregeln."),
    },
    {
      t: 80_200,
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
