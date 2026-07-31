/**
 * The landing page's staged figure: six acts on one seekable clock.
 *
 * Act 1  the brand appears while the model loads, then clears the stage
 * Act 2  four letters of a real Wikipedia address change, and the page opens
 * Act 3  a reading head sweeps the article; each article form turns over as the
 *        head passes it, then what is left shakes and turns over together
 * Act 4  the five definite article forms of Standard German converge on die
 * Act 5  three noun phrases take the same article
 * Act 6  the ending rules, one card at a time
 *
 * The timeline lives in `./scene`; see its header for the two rules every cue
 * here has to obey. The article text is the real lede of the German Wikipedia
 * article on the Sapir-Whorf hypothesis, and its Alman side is recorded from the
 * shipped model rather than written by hand — see ARTICLE_LINES.
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
export const SCENE_DURATION_MS = 101_000;

const WORDMARK_SRC = "/brand/almanpedia-wordmark.svg";
const EMBLEM_SRC = "/brand/almanpedia-potato-192.png";

/**
 * A word that differs between Standard German and Alman.
 *
 * In the article act every one of them turns over as the reading head passes its
 * own column — articles, endings, possessives and pronouns alike. An earlier
 * version held the subtler changes back until the whole page had been read, which
 * left one sentence untouched for twenty seconds and the page looking
 * half-translated for most of the act.
 */
interface Swap {
  de: string;
  al: string;
}

type Piece = string | Swap;

const swap = (de: string, al: string): Swap => ({ de, al });

/**
 * The lede of https://de.wikipedia.org/wiki/Sapir-Whorf-Hypothese, shortened to
 * four sentences.
 *
 * The Alman side is not hand-written: it is what GoePT-1-20M actually returns for
 * these four sentences, recorded from the pinned `@huggingface/transformers`
 * adapter over the digest-verified local package, with the generation parameters
 * from `MODEL_PACKAGE` — the same path as the parity gate in
 * `core/test/model-node.test.ts`. The safe translator passes model output through
 * verbatim, so this is what a visitor reading the real article sees.
 *
 * Where the model picks one of two forms the specification allows, that is noted
 * below; the figure follows the model rather than the preferred variant, because
 * it is showing what this product does, not what the specification prefers.
 */
const ARTICLE_LINES: Piece[][] = [
  [
    "Die Sapir-Whorf-Hypothese ist ",
    swap("eine", "ein"),
    " Annahme aus ",
    swap("der", "die"),
    " Sprachwissenschaft, ",
    // §6f allows die beside the preferred das as the invariant relativizer.
    swap("der", "die"),
    " zufolge die Sprache ",
    swap("das", "die"),
    " Denken beeinflusst.",
  ],
  [
    // §6a: personal pronouns follow natural gender, so an inanimate referent
    // takes es rather than the grammatical sie of "die Hypothese".
    swap("Sie", "Es"),
    " wurde posthum abgeleitet aus Schriften von Benjamin Lee Whorf, ",
    swap("der", "die"),
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
    // §7c: the possessive follows the natural gender of its possessor, which
    // here is an inanimate "Sprache".
    swap("ihren", "sein"),
    " ",
    swap("grammatikalischen", "grammatikalische"),
    " Strukturen die Welterfahrung ",
    // §1d: possession may take the periphrastic von die instead of the genitive
    // der that §1b retains. The model chose the periphrasis here.
    swap("der", "von die"),
    " ",
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
  { t: 7_000, label: "Adresse" },
  { t: 23_000, label: "Artikel" },
  { t: 48_000, label: "Ein Artikel" },
  { t: 61_500, label: "Beispiele" },
  { t: 74_000, label: "Endungen" },
];

interface Counter {
  count: number;
}

/**
 * Acts without a reading head stagger their turnover by position in the list, so
 * each one reads as a wave rather than one flash. In the article act the sweep
 * does the timing instead; see `measureSweepPositions`.
 */
function swapElement(value: Swap, order?: Counter): HTMLElement {
  const element = el("span", {
    class: "th-swap",
    "data-swap": "",
    "data-state": "de",
  }, [
    el("span", { class: "th-swap-de" }, [value.de]),
    el("span", { class: "th-swap-al" }, [value.al]),
  ]);
  // The article act takes its timing from the scanner instead; see measureScan.
  if (order) element.style.setProperty("--swap-index", String(order.count++));
  if (value.de === value.al) element.dataset.same = "";
  return element;
}

function renderPieces(pieces: Piece[], order?: Counter): Node[] {
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

function ruleCard(card: RuleCard, order: Counter): HTMLElement {
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
  const rowOrder = { count: 0 };

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
          el("p", { class: "th-line", "data-line": String(index) }, renderPieces(line)),
        ),
        el("span", { class: "th-scanned", "data-scanned": "" }),
        el("span", { class: "th-scanline", "data-scanline": "" }),
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
    RULE_CARDS.map((card) => ruleCard(card, { count: 0 })));

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
  const swapsIn = (scope: Element) => [...scope.querySelectorAll<HTMLElement>("[data-swap]")];
  /** Every changed word in a line turns over as the head crosses that line. */
  const lineSwaps = lines.map(swapsIn);

  const act = (value: string) => (stage.dataset.act = value);
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
   * Record how far down the article each changed word sits, as a fraction of the
   * scanner's travel, so its turnover can wait until the bar reaches it.
   *
   * Vertical position, deliberately. An earlier version swept a band left to
   * right across each paragraph box and timed words by their column, which put
   * two orders on screen at once: on a sentence that wraps, a word at the start
   * of the second row was passed early while a word at the end of the first row
   * was passed last. One bar moving down the page gives one order, and it is
   * reading order. Words sharing a row share a fraction and turn over together.
   *
   * Offsets rather than client rects, because a hidden act carries a transform
   * and client rects would be scaled by it.
   *
   * This is the one measurement in the figure, and it is safe because no box ever
   * resizes: both spellings of a word share one cell. It runs again once the
   * webfonts are in and whenever the page changes width.
   */
  function measureScan(): void {
    const first = lines[0];
    const last = lines.at(-1);
    if (!first || !last || last.offsetHeight <= 0) return;
    const from = first.offsetTop;
    const travel = Math.max(1, last.offsetTop + last.offsetHeight - from);
    page.style.setProperty("--scan-from", String(from));
    page.style.setProperty("--scan-travel", String(travel));
    for (const line of lines) {
      for (const swap of swapsIn(line)) {
        const centre = line.offsetTop + swap.offsetTop + swap.offsetHeight / 2;
        const at = (centre - from) / travel;
        swap.style.setProperty("--scan-at", Math.min(Math.max(at, 0), 1).toFixed(3));
      }
    }
  }

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

    // Act 3 — one bar down the page; a word shakes as it is passed, then turns.
    {
      t: 23_000,
      fn: () => {
        act("3");
        say("Die Übersetzung liest die Artikel von oben nach unten.");
      },
    },
    {
      t: 24_000,
      fn: () => {
        page.dataset.scanning = "true";
        setSwaps(page, "poof");
      },
    },
    { t: 27_000, fn: () => say("Jede Stelle zittert kurz und wechselt dann.") },
    { t: 32_000, fn: () => say("Artikel, Endungen und Pronomen in ein Durchgang.") },
    { t: 36_000, fn: () => say("Die Substantive bleiben unverändert.") },
    {
      t: 39_000,
      fn: () => {
        setSwaps(page, "al");
        page.dataset.lang = "al";
        pageLang.textContent = "de-AL";
        say("Fertig. Diese Absatz steht jetzt in Alman.");
      },
    },
    {
      t: 43_500,
      fn: () => {
        page.dataset.scanning = "false";
        say("Kein Wort ist verschwunden. Nur die Endungen sind weg.");
      },
    },

    // Act 4 — five forms, one article.
    {
      t: 48_000,
      fn: () => {
        act("4");
        hide(browser);
        show(unify);
        unify.dataset.state = "spread";
        say("Standarddeutsch hat fünf Formen für ein Artikel.");
      },
    },
    { t: 50_000, fn: () => (unify.dataset.state = "gather") },
    { t: 52_000, fn: () => (unify.dataset.state = "merge") },
    {
      t: 53_400,
      fn: () => {
        unify.dataset.state = "merged";
        say("In Alman bleibt ein Form übrig.");
      },
    },
    {
      t: 57_000,
      fn: () => {
        unify.dataset.state = "genitive";
        say("Ein Ausnahme: in die Genitiv steht der, wie in „die Haus der Mann“.");
      },
    },
    { t: 61_000, fn: () => { hide(unify); unify.dataset.state = "genitive"; } },

    // Act 5 — the same article in front of three nouns.
    {
      t: 61_500,
      fn: () => {
        act("5");
        show(rows);
        say("Drei Substantive, drei Genus in Standarddeutsch.");
      },
    },
    { t: 63_200, fn: () => show(rowElements[0]!) },
    { t: 64_200, fn: () => show(rowElements[1]!) },
    { t: 65_200, fn: () => show(rowElements[2]!) },
    { t: 66_800, fn: () => setSwaps(rows, "poof") },
    {
      t: 68_200,
      fn: () => {
        setSwaps(rows, "al");
        say("die Mann, die Frau, die Kind.");
      },
    },
    { t: 71_200, fn: () => say("Die Substantiv bleibt, wie es war.") },
    { t: 73_800, fn: () => hide(rows) },

    // Act 6 — the ending rules, one card at a time.
    {
      t: 74_000,
      fn: () => {
        act("6");
        show(cards);
        say("Die Endungen folgen wenige Regeln.");
      },
    },
    ...cardElements.flatMap((card, index): Cue[] => {
      const at = 75_500 + index * 3_000;
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
      t: 93_500,
      fn: () => say("Ein Artikel, ein Adjektivendung, kein Genusregeln."),
    },
    {
      t: 96_500,
      fn: () => {
        hide(cards);
        show(outro);
        say("Jede Artikel der deutschsprachige Wikipedia, lokal vereinfacht.");
      },
    },
  ];

  function reset(): void {
    act("0");
    for (const element of [logo, browser, page, unify, rows, cards, outro, enter, caption]) hide(element);
    for (const element of [...lines, ...rowElements, ...cardElements]) hide(element);
    for (const element of cardElements) element.dataset.state = "de";
    setSwaps(stage, "de");
    boot.dataset.state = "idle";
    omnibox.dataset.stage = "start";
    load.dataset.state = "idle";
    page.dataset.lang = "de";
    page.dataset.scanning = "false";
    pageLang.textContent = "de";
    unify.dataset.state = "spread";
    caption.textContent = "";
  }

  const transport = createTransport(CHAPTERS, SCENE_DURATION_MS, (ms) => scene?.seekTo(ms));
  const element = el("div", { class: "th-theater", "data-theater": "" }, [
    el("div", { class: "th-stagewrap" }, [stage]),
    transport.element,
  ]);

  let scene: ReturnType<typeof createScene> | null = null;
  let resize: ResizeObserver | null = null;
  let running = false;

  return {
    element,
    start() {
      if (scene) return;
      running = true;
      measureScan();
      void document.fonts?.ready.then(measureScan);
      if (typeof ResizeObserver === "function") {
        resize = new ResizeObserver(() => measureScan());
        resize.observe(page);
      }
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
      resize?.disconnect();
      resize = null;
      scene?.setPlaying(false);
      scene = null;
    },
    seekTo(ms) {
      scene?.seekTo(ms);
    },
  };
}
