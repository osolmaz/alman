/**
 * Client logic of the translator page. Wires the shared @alman/core engine
 * (the same safe-translation pipeline behind almanpedia.org and the browser
 * extension) to the two-pane UI rendered by TranslatorPage.astro.
 */
import {
  MODEL_PACKAGE,
  createAlmanEngine,
  createSegmentCache,
  createWorkerClient,
  fixedDetector,
  sentenceSegments,
  type AssetProgress,
  type SafeTranslator,
  type TranslationClient,
} from "@alman/core";

interface TranslatorStrings {
  numberLocale: string;
  statusDownloading: string;
  statusPreparing: string;
  statusReady: string;
  statusTranslating: string;
  statusError: string;
  copied: string;
}

const DEBOUNCE_MS = 400;

export function initTranslator(root: HTMLElement): void {
  const stringsEl = root.querySelector<HTMLScriptElement>("script[data-translator-strings]");
  const source = root.querySelector<HTMLTextAreaElement>("[data-source]");
  const target = root.querySelector<HTMLElement>("[data-target]");
  const statusEl = root.querySelector<HTMLElement>("[data-status]");
  const progressEl = root.querySelector<HTMLElement>("[data-progress]");
  const progressFill = root.querySelector<HTMLElement>("[data-progress-fill]");
  const charCount = root.querySelector<HTMLElement>("[data-char-count]");
  const clearButton = root.querySelector<HTMLButtonElement>("[data-clear]");
  const copyButton = root.querySelector<HTMLButtonElement>("[data-copy]");
  if (
    !stringsEl?.textContent ||
    !source ||
    !target ||
    !statusEl ||
    !progressEl ||
    !progressFill ||
    !charCount ||
    !clearButton ||
    !copyButton
  ) {
    return;
  }

  const strings = JSON.parse(stringsEl.textContent) as TranslatorStrings;
  const idleStatus = statusEl.textContent ?? "";
  const copyLabel = copyButton.textContent ?? "";

  let client: TranslationClient | null = null;
  let engine: SafeTranslator | null = null;
  let initPromise: Promise<unknown> | null = null;
  let modelReady = false;
  let runId = 0;
  let debounceTimer: number | undefined;
  let copyTimer: number | undefined;

  const formatMb = (bytes: number): string =>
    (bytes / 1e6).toLocaleString(strings.numberLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  function setStatus(text: string, state: "idle" | "loading" | "translating" | "ready" | "error"): void {
    statusEl!.textContent = text;
    root.dataset.state = state;
  }

  function getClient(): TranslationClient {
    client ??= createWorkerClient({
      createWorker: () =>
        new Worker(new URL("./translate-worker.ts", import.meta.url), { type: "module" }),
      wasmBaseUrl: new URL("/ort/", window.location.href).href,
    });
    return client;
  }

  function getEngine(): SafeTranslator {
    engine ??= createAlmanEngine({
      client: getClient(),
      // The source pane is declared German, so per-sentence language
      // detection would only silently skip short or name-heavy sentences.
      detector: fixedDetector({ language: "de", confidence: 1 }),
      cache: createSegmentCache({ modelRevision: MODEL_PACKAGE.revision }),
      // More headroom than the 3s default of the DOM pipeline: on slow
      // hardware a long sentence would otherwise silently stay untranslated.
      timeoutMs: 15_000,
    });
    return engine;
  }

  function onProgress(progress: AssetProgress): void {
    if (progress.phase === "compile") {
      progressEl!.hidden = false;
      progressFill!.style.width = "100%";
      setStatus(strings.statusPreparing, "loading");
      return;
    }
    if (progress.phase === "download") {
      progressEl!.hidden = false;
      const pct = progress.overallTotal > 0 ? (100 * progress.overallLoaded) / progress.overallTotal : 0;
      progressFill!.style.width = `${pct.toFixed(1)}%`;
      setStatus(
        strings.statusDownloading
          .replace("{loaded}", formatMb(progress.overallLoaded))
          .replace("{total}", formatMb(progress.overallTotal)),
        "loading",
      );
    }
  }

  function ensureModel(): Promise<unknown> {
    initPromise ??= getClient()
      .init(onProgress)
      .then(() => {
        modelReady = true;
        progressEl!.hidden = true;
        setStatus(strings.statusReady, "ready");
      })
      .catch((error: unknown) => {
        // The worker client killed itself; allow the next input to retry.
        initPromise = null;
        progressEl!.hidden = true;
        setStatus(strings.statusError, "error");
        throw error;
      });
    return initPromise;
  }

  // Line breaks in pasted text are hard segment boundaries. Intl.Segmenter
  // only splits on sentence punctuation, so without this a heading or a long
  // list line would be glued into one oversized model input.
  function* inputSegments(text: string): Generator<string> {
    for (const part of text.split(/(\n)/)) {
      if (part === "\n" || !part.trim()) {
        if (part) yield part;
        continue;
      }
      yield* sentenceSegments(part, "de");
    }
  }

  // The model's task is a near-copy of its input, so a translation that is
  // much longer than its source is a decoder repetition loop. Treat the
  // segment as unsafe and keep the original, like other guarded inputs.
  const looksDegenerate = (segment: string, translated: string): boolean =>
    translated.length > segment.length * 1.5 + 80;

  async function translateNow(): Promise<void> {
    runId += 1;
    const id = runId;
    const text = source!.value;
    if (!text.trim()) {
      target!.textContent = "";
      copyButton!.disabled = true;
      if (modelReady) setStatus(strings.statusReady, "ready");
      else if (!initPromise) setStatus(idleStatus, "idle");
      return;
    }
    try {
      await ensureModel();
    } catch {
      return;
    }
    if (id !== runId) return;
    setStatus(strings.statusTranslating, "translating");
    const activeEngine = getEngine();
    let output = "";
    target!.textContent = "";
    for (const segment of inputSegments(text)) {
      if (segment === "\n" || !segment.trim()) {
        output += segment;
        target!.textContent = output;
        continue;
      }
      let translated = await activeEngine.translateSegment(segment);
      if (id !== runId) return;
      if (translated !== segment && looksDegenerate(segment, translated)) {
        translated = segment;
      }
      output += translated;
      target!.textContent = output;
      copyButton!.disabled = output.trim() === "";
    }
    setStatus(strings.statusReady, "ready");
  }

  function refreshCharCount(): void {
    charCount!.textContent = String(source!.value.length);
  }

  // Grow the source box with its content so it never scrolls internally.
  // The CSS min-height (which is responsive) stays the floor.
  function autosizeSource(): void {
    const style = source!.style;
    style.minHeight = "";
    // flex-grow would keep the box stretched while measuring, so the box
    // could never shrink back after text is deleted.
    style.flex = "0 0 auto";
    style.height = "0";
    const floor = parseFloat(getComputedStyle(source!).minHeight) || 0;
    const needed = Math.max(source!.scrollHeight, floor);
    style.height = "";
    style.flex = "";
    style.minHeight = `${needed}px`;
  }

  function refreshSource(): void {
    refreshCharCount();
    autosizeSource();
  }

  source.addEventListener("input", () => {
    refreshSource();
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => void translateNow(), DEBOUNCE_MS);
  });

  window.addEventListener("resize", autosizeSource);

  clearButton.addEventListener("click", () => {
    window.clearTimeout(debounceTimer);
    source!.value = "";
    refreshSource();
    void translateNow();
    source!.focus();
  });

  copyButton.addEventListener("click", () => {
    const text = target!.textContent ?? "";
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => {
      copyButton!.textContent = strings.copied;
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        copyButton!.textContent = copyLabel;
      }, 1500);
    });
  });

  for (const sample of root.querySelectorAll<HTMLButtonElement>("[data-sample]")) {
    sample.addEventListener("click", () => {
      window.clearTimeout(debounceTimer);
      source!.value = sample.textContent?.trim() ?? "";
      refreshSource();
      void translateNow();
    });
  }

  window.addEventListener("pagehide", () => {
    void client?.dispose();
    client = null;
    engine = null;
    initPromise = null;
    modelReady = false;
  });
}
