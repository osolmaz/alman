import type { Locale } from "../i18n/ui";

export const almanBenchCopy = {
  en: {
    description:
      "AlmanBench measures language and grammatical reasoning capabilities, specifically in German.",
    lead:
      "AlmanBench measures language and grammatical reasoning capabilities, " +
      "specifically in German. Its 1,029 public items test whether a language model can apply " +
      "the complete Alman specification to real German prose, from " +
      "canonical literature to contemporary text.",
    lead2:
      "AlmanBench also enjoys a rare form of benchmark integrity. No lab " +
      "is going to burn a training run on gaming a German simplification " +
      "dataset, so the scores measure what the models can actually do. " +
      "Obscurity is our contamination policy.",
    linkDataset: "Dataset",
    linkResults: "Results",
    linkGithub: "GitHub",
    linkSpec: "Specification",
    resultsH: "Results",
    tiersH: "Score by tier",
    compH: "Composition",
    compP:
      "The public set contains 1,029 items in four tiers. A private " +
      "held-out set of about 200 further items, reviewed to the same " +
      "standard, is never published and prices training contamination " +
      "over time. Every published row carries a canary GUID so the data " +
      "can be filtered from training corpora.",
    compTh: ["Tier", "Items", "Purpose"],
    compRows: [
      [
        "naturalistic",
        600,
        "Real prose with interacting rules. Half canonical literature (1500 to 1955), half contemporary German from Wikipedia, Tatoeba, and hand-authored sentences.",
      ],
      [
        "targeted",
        216,
        "Hand-authored items that lift rare rules to at least 25 observations each.",
      ],
      [
        "guards",
        120,
        "Overcorrection traps in eight families. Forms that Alman keeps, which a surface-form stripper would wrongly change.",
      ],
      [
        "curated",
        93,
        "Hand-translated demonstrative core. Every specification rule is the designated target of at least one item.",
      ],
    ],
    exampleH: "Example item",
    exampleIntro:
      "A naturalistic item from German Wikipedia. The genitive after " +
      "*Familie* may keep *der* or take the *von* periphrasis, so the " +
      "reference lists both valid renderings.",
    exampleSrc: "Standard German",
    exampleAccepted: "Valid renderings",
    canonicalMark: "canonical",
    runH: "Running the benchmark",
    runP:
      "The dataset is published on Hugging Face. The harness ships with " +
      "the alman repository and runs against any model supported by " +
      "Inspect AI.",
    citeH: "Citation",
    thModel: "Model",
  },
  de: {
    description:
      "AlmanBench misst sprachliches und grammatisches Schlussfolgern, speziell im Deutschen.",
    lead:
      "AlmanBench misst sprachliches und grammatisches Schlussfolgern, " +
      "speziell im Deutschen. Ihre 1.029 öffentlichen Testfälle prüfen, ob ein " +
      "Sprachmodell die vollständige Alman-Spezifikation auf echte " +
      "deutsche Prosa anwenden kann, von kanonischer Literatur bis zu " +
      "zeitgenössischen Texten.",
    lead2:
      "AlmanBench genießt außerdem eine seltene Form von " +
      "Benchmark-Integrität. Kein Labor wird einen Trainingslauf darauf " +
      "verschwenden, einen Datensatz zur deutschen Sprachvereinfachung zu " +
      "manipulieren, also messen die Scores, was die Modelle tatsächlich " +
      "können. Obskurität ist unsere Kontaminationsrichtlinie.",
    linkDataset: "Datensatz",
    linkResults: "Ergebnisse",
    linkGithub: "GitHub",
    linkSpec: "Spezifikation",
    resultsH: "Ergebnisse",
    tiersH: "Score nach Ebene",
    compH: "Zusammensetzung",
    compP:
      "Der öffentliche Satz enthält 1.029 Testfälle in vier Ebenen. Ein " +
      "privater zurückgehaltener Satz von rund 200 weiteren Testfällen, " +
      "nach demselben Standard geprüft, wird nie veröffentlicht und misst " +
      "Trainingskontamination über die Zeit. Jede veröffentlichte Zeile " +
      "trägt eine Canary-GUID, damit die Daten aus Trainingskorpora " +
      "gefiltert werden können.",
    compTh: ["Ebene", "Testfälle", "Aufgabe"],
    compRows: [
      [
        "naturalistic",
        600,
        "Echte Prosa mit zusammenwirkenden Regeln. Zur Hälfte kanonische Literatur (1500 bis 1955), zur Hälfte zeitgenössisches Deutsch aus Wikipedia, Tatoeba und handgeschriebenen Sätzen.",
      ],
      [
        "targeted",
        216,
        "Handgeschriebene Testfälle, die seltene Regeln auf mindestens 25 Beobachtungen heben.",
      ],
      [
        "guards",
        120,
        "Überkorrektur-Fallen in acht Familien. Formen, die Alman behält und die ein Oberflächenformen-Entferner fälschlich ändern würde.",
      ],
      [
        "curated",
        93,
        "Handübersetzter demonstrativer Kern. Jede Regel der Spezifikation ist das ausgewiesene Ziel von mindestens einem Testfall.",
      ],
    ],
    exampleH: "Beispiel-Testfall",
    exampleIntro:
      "Ein naturalistischer Testfall aus der deutschen Wikipedia. Der " +
      "Genitiv nach *Familie* darf *der* behalten oder die " +
      "*von*-Umschreibung nehmen. Daher führt die Referenz beide gültigen " +
      "Wiedergaben auf.",
    exampleSrc: "Standarddeutsch",
    exampleAccepted: "Gültige Wiedergaben",
    canonicalMark: "kanonisch",
    runH: "Die Benchmark ausführen",
    runP:
      "Der Datensatz ist auf Hugging Face veröffentlicht. Der " +
      "Benchmark-Code liegt im alman-Repository und läuft gegen jedes von " +
      "Inspect AI unterstützte Modell.",
    citeH: "Zitieren",
    thModel: "Modell",
  },
  al: {
    description:
      "AlmanBench misst sprachliche und grammatische Schlussfolgern, speziell in die Deutsche.",
    lead:
      "AlmanBench misst sprachliche und grammatische Schlussfolgern, " +
      "speziell in die Deutsche. Ihr 1.029 öffentliche Testfälle prüfen, ob ein " +
      "Sprachmodell die vollständige Alman-Spezifikation auf echte " +
      "deutsche Prosa anwenden kann, von kanonische Literatur bis zu " +
      "zeitgenössische Texte.",
    lead2:
      "AlmanBench genießt außerdem ein seltene Form von " +
      "Benchmark-Integrität. Kein Labor wird ein Trainingslauf darauf " +
      "verschwenden, ein Datensatz zu die deutsche Sprachvereinfachung zu " +
      "manipulieren, also messen die Scores, was die Modelle tatsächlich " +
      "können. Obskurität ist unser Kontaminationsrichtlinie.",
    linkDataset: "Datensatz",
    linkResults: "Ergebnisse",
    linkGithub: "GitHub",
    linkSpec: "Spezifikation",
    resultsH: "Ergebnisse",
    tiersH: "Score nach Ebene",
    compH: "Zusammensetzung",
    compP:
      "Die öffentliche Satz enthält 1.029 Testfälle in vier Ebenen. Ein " +
      "private zurückgehaltene Satz von rund 200 weitere Testfälle, nach " +
      "dieselbe Standard geprüft, wird nie veröffentlicht und misst " +
      "Trainingskontamination über die Zeit. Jede veröffentlichte Zeile " +
      "trägt ein Canary-GUID, damit die Daten aus Trainingskorpora " +
      "gefiltert werden können.",
    compTh: ["Ebene", "Testfälle", "Aufgabe"],
    compRows: [
      [
        "naturalistic",
        600,
        "Echte Prosa mit zusammenwirkende Regeln. Zu die Hälfte kanonische Literatur (1500 bis 1955), zu die Hälfte zeitgenössische Deutsch aus Wikipedia, Tatoeba und handgeschriebene Sätze.",
      ],
      [
        "targeted",
        216,
        "Handgeschriebene Testfälle, das seltene Regeln auf mindestens 25 Beobachtungen heben.",
      ],
      [
        "guards",
        120,
        "Überkorrektur-Fallen in acht Familien. Formen, das Alman behält und das ein Oberflächenformen-Entferner fälschlich ändern würde.",
      ],
      [
        "curated",
        93,
        "Handübersetzte demonstrative Kern. Jede Regel der Spezifikation ist die ausgewiesene Ziel von mindestens ein Testfall.",
      ],
    ],
    exampleH: "Beispiel-Testfall",
    exampleIntro:
      "Ein naturalistische Testfall aus die deutsche Wikipedia. Die " +
      "Genitiv nach *Familie* darf *der* behalten oder die " +
      "*von*-Umschreibung nehmen. Daher führt die Referenz beide gültige " +
      "Wiedergaben auf.",
    exampleSrc: "Standarddeutsch",
    exampleAccepted: "Gültige Wiedergaben",
    canonicalMark: "kanonisch",
    runH: "Die Benchmark ausführen",
    runP:
      "Die Datensatz ist auf Hugging Face veröffentlicht. Die " +
      "Benchmark-Code liegt in die alman-Repository und läuft gegen jede " +
      "von Inspect AI unterstützte Modell.",
    citeH: "Zitieren",
    thModel: "Modell",
  },
};

export const almanBenchExample = {
  id: "almanbench/modern-wikipedia/pub-023",
  source: "Der Braunbär gehört zu den Säugetieren aus der Familie der Bären.",
  accepted: [
    "Die Braunbär gehört zu die Säugetiere aus die Familie der Bären.",
    "Die Braunbär gehört zu die Säugetiere aus die Familie von die Bären.",
  ],
};

export const almanBenchBibtex = `@misc{almanbench2026,
  title        = {AlmanBench: A Standard German to Alman Translation Benchmark},
  author       = {Solmaz, Onur},
  year         = {2026},
  howpublished = {\\url{https://alman.ai/almanbench/}}
}`;

export const getAlmanBenchCopy = (locale: Locale) => almanBenchCopy[locale];
