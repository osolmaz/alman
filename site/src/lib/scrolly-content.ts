export type RichText = string;

export interface ScrollyStep {
  kicker: string;
  body: RichText;
}

export interface CardHead {
  left: string;
  right: string;
}

export interface TransformCell {
  from?: string;
  to?: string;
  text?: string;
  stays?: boolean;
}

export interface TransformRow {
  label: string;
  cells: TransformCell[];
  className?: string;
}

export type SentenceSegment =
  | string
  | {
      at: number;
      from: string;
      to: string;
    };

export const scrollyContent = {
  lead: {
    kicker: "Amtliche Vorführung",
    title: "German, simplified.",
    subtitle: "The simplification procedure, demonstrated. Scroll to proceed.",
  },
  steps: [
    {
      kicker: "Vorgang 1880-TW-001",
      body: "In 1880, an American author filed [a detailed complaint](/blog/the-awful-german-language/) about the German language, together with a proposal for its reform. He had studied it for nine weeks, under great difficulty and annoyance; three of his teachers died in the meantime. The file has remained open since.",
    },
    {
      kicker: "Beweisaufnahme",
      body: "Supporting evidence was attached: a dialogue from one of the best of the German Sunday-school books, in which a turnip is *she* and a young lady is *it*. The Institut has reviewed the material. No error on the applicant's part could be established.",
    },
    {
      kicker: "Bestandsaufnahme",
      body: "The applicant further submitted an inventory: a tree is male, its buds are female, its leaves are neuter; horses are sexless, dogs are male, cats are female — tomcats included, of course. A wife, he noted, has no sex at all. The inventory has been verified against the dictionary. It is accurate.",
    },
    {
      kicker: "Reformvorschläge",
      body: "The applicant supplied remedies, estimating that a gifted person ought to learn English in thirty hours, French in thirty days, and German in thirty years. Proposals 1 and 4 fall within the Institut's remit. Processing begins — 146 years after receipt, well within the usual administrative timeframe.",
    },
    {
      kicker: "Befund",
      body: "The complaint has merit. Standard German declines its definite article across three genders, four cases and two numbers: sixteen slots, six forms, and no system by which to learn them.",
    },
    {
      kicker: "Präzedenzfall",
      body: "A precedent exists. English — also a Germanic language — once declined its article through the same three genders and four cases: *se mōna*, the he-moon; *sēo sunne*, the she-sun; *þæt wīf*, the it-wife. Sixteen slots, nine forms. Any Anglo-Saxon would have understood the applicant's suffering.",
    },
    {
      kicker: "Präzedenzfall, Fortsetzung",
      body: "Then it stopped. Between roughly 1150 and 1300 the endings wore away, the sixteen slots merged into a single **the**, and the grammatical genders went with them. No committee was involved. No intelligibility was lost.",
    },
    {
      kicker: "Präzedenzfall, Ergebnis",
      body: "Since then, English assigns gender by nature rather than by dictionary: the moon is *it*, the sun is *it*, a wife is *she*. The applicant's turnip problem does not arise. Nobody has requested the old forms back.",
    },
    {
      kicker: "Abhilfe · §1a, §1b",
      body: "The same procedure is hereby applied to German — by regulation rather than by seven centuries of erosion. Every non-genitive context receives **die**; the genitive receives **der**. The applicant's first proposal, to leave out the dative case, is exceeded: the accusative goes with it.",
    },
    {
      kicker: "Eingang",
      body: "The procedure extends to whole sentences. For demonstration, one is submitted for processing: the opening of Kafka's *Die Verwandlung*.",
    },
    {
      kicker: "§2a",
      body: "The indefinite article adopts its invariant base form **ein**. Case endings are discarded: *eines Morgens* and *einem* are corrected.",
    },
    {
      kicker: "§3a",
      body: "Case endings on nouns are eliminated. The dative plural *Träumen* loses its *-n* and reverts to the plain plural *Träume*.",
    },
    {
      kicker: "§4a",
      body: 'The applicant reported he would "rather decline two drinks than one German adjective." The matter is resolved: all adjective endings regularize to an invariant **-e**.',
    },
    {
      kicker: "§7c",
      body: "Possessive determiners keep their bare base form in all non-genitive contexts: *seinem Bett* is corrected to *sein Bett*.",
    },
    {
      kicker: "Bescheid",
      body: "Processing complete. The sentence remains German; every speaker understands it. File 1880-TW-001 is closed after 146 years. The applicant is deemed notified.",
    },
    {
      kicker: "Weltsprachen-Register",
      body: "For the record: since shedding its genders, English has accumulated one and a half billion speakers. German maintains a hundred and thirty million, a three-gender system, and a reputation. The Institut notes the correlation.",
    },
    {
      kicker: "Zweck des Verfahrens",
      body: "The objective is on record. Alman diverges from Standard German as little as possible, can be learned in an afternoon, and is no slang and no ethnolect — ethnicity-less, class-less, open to all, native speakers included. What English accomplished by accident, German shall have by regulation: a gender-equitable world language, and an alternative path to fluency for the millions learning it. The full procedure is codified below in [§1–§10](#definite-articles).",
    },
  ] satisfies ScrollyStep[],
  caseFile: {
    head: { left: "Az. 1880-TW-001", right: "Antrag auf Sprachreform" },
    meta: [
      "Antragsteller: Twain, M. (Heidelberg)",
      "Eingegangen: 1880 · Status: **offen**",
      "Gemeldete Verluste: drei Lehrkräfte",
    ],
    quote:
      "Every noun has a gender, and there is no sense or system in the distribution; so the gender of each must be learned separately and by heart. There is no other way. … In German, a young lady has no sex, while a turnip has.",
    attribution: "— M. Twain, [*A Tramp Abroad* (1880)](/blog/the-awful-german-language/)",
    annexLabel: "Anlage 1: Beweisstück",
    dialogue: [
      { speaker: "Gretchen.", text: "Wilhelm, where is the turnip?" },
      { speaker: "Wilhelm.", text: "She has gone to the kitchen." },
      {
        speaker: "Gretchen.",
        text: "Where is the accomplished and beautiful English maiden?",
      },
      { speaker: "Wilhelm.", text: "It has gone to the opera." },
    ],
  },
  inventory: {
    head: { left: "Az. 1880-TW-001", right: "Anlage 2: Bestandsaufnahme" },
    headers: ["Gegenstand", "Geschlecht lt. Wörterbuch"],
    rows: [
      { item: "der Baum", gloss: "tree", gender: "männlich", symbol: "♂" },
      { item: "die Knospe", gloss: "its bud", gender: "weiblich", symbol: "♀" },
      { item: "das Blatt", gloss: "its leaf", gender: "sächlich", symbol: "⚲" },
      { item: "der Hund", gloss: "dog", gender: "männlich", symbol: "♂" },
      {
        item: "die Katze",
        gloss: "cat, incl. tomcats",
        gender: "weiblich",
        symbol: "♀",
      },
      { item: "das Pferd", gloss: "horse", gender: "sächlich", symbol: "⚲" },
      { item: "das Weib", gloss: "wife", gender: "sächlich", symbol: "⚲" },
      { item: "die Steckrübe", gloss: "turnip", gender: "weiblich", symbol: "♀" },
      { item: "das Mädchen", gloss: "young lady", gender: "sächlich", symbol: "⚲" },
    ],
    verdict: "Systematik: keine.",
  },
  proposals: {
    head: {
      left: "Az. 1880-TW-001",
      right: "Anlage 3: Reformvorschläge (Auszug)",
    },
    items: [
      {
        value: 1,
        text: "In the first place, I would leave out the Dative case. … The Dative case is but an ornamental folly — it is better to discard it.",
      },
      {
        value: 4,
        text: "Fourthly, I would reorganize the sexes, and distribute them according to the will of the creator. This as a tribute of respect, if nothing else.",
      },
      {
        value: 7,
        text: "Seventhly, I would discard the Parenthesis. … Infractions of this law should be punishable with death.",
      },
    ],
    note: "Vermerk: Vorschläge 1 und 4 fallen in die Zuständigkeit des Instituts.",
  },
  germanArticles: {
    head: { left: "Anlage 4", right: "Bestimmter Artikel, Standarddeutsch" },
    headers: ["Mask.", "Fem.", "Neut.", "Plural"],
    rows: [
      {
        label: "Nominativ",
        cells: [
          { from: "der", to: "die" },
          { text: "die", stays: true },
          { from: "das", to: "die" },
          { text: "die", stays: true },
        ],
      },
      {
        label: "Akkusativ",
        cells: [
          { from: "den", to: "die" },
          { text: "die", stays: true },
          { from: "das", to: "die" },
          { text: "die", stays: true },
        ],
      },
      {
        label: "Dativ",
        cells: [
          { from: "dem", to: "die" },
          { from: "der", to: "die" },
          { from: "dem", to: "die" },
          { from: "den", to: "die" },
        ],
      },
      {
        label: "Genitiv",
        className: "gen",
        cells: [
          { from: "des", to: "der" },
          { text: "der", stays: true },
          { from: "des", to: "der" },
          { text: "der", stays: true },
        ],
      },
    ] satisfies TransformRow[],
    verdict: "Sechzehn Felder. Zwei Formen.",
  },
  oldEnglishArticles: {
    head: { left: "Präzedenzfall", right: "Bestimmter Artikel, Altenglisch (ca. 900)" },
    headers: ["Mask.", "Fem.", "Neut.", "Plural"],
    rows: [
      {
        label: "Nominativ",
        cells: [
          { from: "se", to: "the" },
          { from: "sēo", to: "the" },
          { from: "þæt", to: "the" },
          { from: "þā", to: "the" },
        ],
      },
      {
        label: "Akkusativ",
        cells: [
          { from: "þone", to: "the" },
          { from: "þā", to: "the" },
          { from: "þæt", to: "the" },
          { from: "þā", to: "the" },
        ],
      },
      {
        label: "Dativ",
        cells: [
          { from: "þǣm", to: "the" },
          { from: "þǣre", to: "the" },
          { from: "þǣm", to: "the" },
          { from: "þǣm", to: "the" },
        ],
      },
      {
        label: "Genitiv",
        cells: [
          { from: "þæs", to: "the" },
          { from: "þǣre", to: "the" },
          { from: "þæs", to: "the" },
          { from: "þāra", to: "the" },
        ],
      },
    ] satisfies TransformRow[],
    verdict: "Sechzehn Felder. Eine Form.",
  },
  precedent: {
    head: { left: "Präzedenzfall", right: "Erledigt ca. 1300" },
    headers: ["Altenglisch", "Mittelenglisch", "Heute"],
    rows: [
      { old: "se mōna", gloss: "m.", middle: "þe mone", today: "the moon" },
      { old: "sēo sunne", gloss: "f.", middle: "þe sonne", today: "the sun" },
      { old: "þæt wīf", gloss: "n.", middle: "þe wif", today: "the wife" },
    ],
    verdict: "Erledigt. Keine Beschwerden seit 700 Jahren.",
  },
  document: {
    head: { left: "Formblatt AL-2", right: "Antrag auf Vereinfachung" },
    source: "Eingang: F. Kafka, *Die Verwandlung* (1915), Satz 1",
    sentence: [
      "Als Gregor Samsa ",
      { at: 10, from: "eines Morgens", to: "ein Morgen" },
      " aus ",
      { at: 12, from: "unruhigen", to: "unruhige" },
      " ",
      { at: 11, from: "Träumen", to: "Träume" },
      " erwachte, fand er sich in ",
      { at: 13, from: "seinem", to: "sein" },
      " Bett zu ",
      { at: 10, from: "einem", to: "ein" },
      " ",
      { at: 12, from: "ungeheueren", to: "ungeheure" },
      " Ungeziefer verwandelt.",
    ] satisfies SentenceSegment[],
    chips: [
      { at: 10, text: "§2a" },
      { at: 11, text: "§3a" },
      { at: 12, text: "§4a" },
      { at: 13, text: "§7c" },
    ],
    cleanLabel: "Reinschrift",
    cleanSentence:
      "Als Gregor Samsa ein Morgen aus unruhige Träume erwachte, fand er sich in sein Bett zu ein ungeheure Ungeziefer verwandelt.",
    stamp: {
      line1: "Amtlich vereinfacht",
      line2: "Geprüft · §1–§10",
    },
  },
  world: {
    head: { left: "Anlage W", right: "Weltsprachen-Register" },
    legend: [
      {
        className: "legend-en",
        swatchClass: "swatch-en",
        language: "Englisch — 1,5 Mrd. Sprecher",
        gloss: "entgendert ca. 1300",
      },
      {
        className: "legend-de-now",
        swatchClass: "swatch-de",
        language: "Deutsch — 0,13 Mrd. Sprecher",
        gloss: "Stand: vor Vereinfachung",
      },
      {
        className: "legend-de-plan",
        swatchClass: "swatch-plan",
        language: "Deutsch — Prognose",
        gloss: "nach Vereinfachung",
        at: 16,
      },
    ],
  },
} as const;
