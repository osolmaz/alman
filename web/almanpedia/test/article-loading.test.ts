// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const engine = vi.hoisted(() => ({
  getEngine: vi.fn(),
  initModel: vi.fn(),
}));
const domTranslator = vi.hoisted(() => {
  const controller = {
    start: vi.fn(),
    stop: vi.fn(),
    restoreOriginals: vi.fn(),
    reapplyTranslations: vi.fn(),
    applyTranslation: vi.fn(() => false),
    translateAll: vi.fn(),
    createDifferenceClone: vi.fn(() => document.createElement("article")),
    stats: vi.fn(() => ({ totalBlocks: 1, translatedBlocks: 0, pendingBlocks: 1, pendingVisibleBlocks: 1, translatedNodes: 0 })),
    whenIdle: vi.fn(async () => {}),
  };
  return { controller, create: vi.fn(() => controller) };
});

vi.mock("../src/engine", () => engine);
vi.mock("@alman/core", () => ({ createDomTranslator: domTranslator.create }));

import { renderArticle, renderShell } from "../src/ui/views";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function articleResponse(title: string, text = `${title} Inhalt`): Response {
  const html = `<!doctype html><html><head><title>${title}</title><link rel="dc:isVersionOf" href="//de.wikipedia.org/wiki/${encodeURIComponent(title)}"></head><body><p id="lead">${text}</p></body></html>`;
  return {
    ok: true,
    status: 200,
    url: `https://de.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`,
    text: async () => html,
  } as Response;
}

function createShell() {
  const root = document.createElement("div");
  document.body.append(root);
  return renderShell(root, () => {});
}

beforeEach(() => {
  // Each test is a fresh browser, so no memory-kill record carries over.
  localStorage.clear();
  sessionStorage.clear();
  engine.initModel.mockReset();
  engine.initModel.mockRejectedValue(new Error("model unavailable in loading tests"));
  engine.getEngine.mockReset();
  engine.getEngine.mockReturnValue({});
  domTranslator.create.mockClear();
  for (const value of Object.values(domTranslator.controller)) {
    if (typeof value === "function" && "mockClear" in value) value.mockClear();
  }
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

test("direct article loads show the requested title in an article-shaped skeleton", async () => {
  const request = deferred<Response>();
  vi.stubGlobal("fetch", vi.fn(() => request.promise));
  history.replaceState(null, "", "/wiki/Neue_Seite");
  const shell = createShell();

  const rendering = renderArticle(shell, "Neue_Seite");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

  expect(shell.main.getAttribute("aria-busy")).toBe("true");
  expect(shell.main.querySelector("[data-article-loading-skeleton]")).not.toBeNull();
  expect(shell.main.querySelector(".article-title")?.textContent).toBe("Neue Seite");
  expect(shell.main.querySelectorAll(".article-loading-line").length).toBeGreaterThan(4);
  expect(shell.status.querySelector(".progress")?.hasAttribute("data-indeterminate")).toBe(true);
  expect(shell.status.textContent).toContain("Neue Seite");

  request.reject(new Error("offline"));
  await rendering;
});

test("internal navigation retains and disables the current article until loading finishes", async () => {
  const request = deferred<Response>();
  vi.stubGlobal("fetch", vi.fn(() => request.promise));
  const shell = createShell();
  const retained = document.createElement("div");
  retained.className = "article-layout";
  retained.append(document.createElement("article"));
  shell.main.className = "site-main article-page";
  shell.main.replaceChildren(retained);
  document.title = "Alter Artikel – Almanpedia";
  history.replaceState(null, "", "/wiki/Neuer_Artikel");

  const rendering = renderArticle(shell, "Neuer_Artikel");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

  expect(shell.main.querySelector(".article-layout")).toBe(retained);
  expect(retained.hasAttribute("inert")).toBe(true);
  expect(retained.hasAttribute("data-article-retained")).toBe(true);
  expect(shell.main.querySelector("[data-article-loading-skeleton]")).toBeNull();

  request.reject(new Error("offline"));
  await rendering;

  expect(retained.isConnected).toBe(true);
  expect(retained.hasAttribute("inert")).toBe(false);
  expect(shell.main.querySelector(".article-loading-error")?.textContent).toContain("Der vorige Artikel bleibt geöffnet");
  expect(document.title).toBe("Alter Artikel – Almanpedia");
  expect(location.pathname).toBe("/wiki/Neuer_Artikel");
});

test("slow loads reveal retry and original-source actions after eight seconds", async () => {
  vi.useFakeTimers();
  const first = deferred<Response>();
  const second = deferred<Response>();
  const requests = [first, second];
  const fetchMock = vi.fn<FetchLike>(() => requests.shift()!.promise);
  vi.stubGlobal("fetch", fetchMock);
  history.replaceState(null, "", "/wiki/Langsamer_Artikel");
  const shell = createShell();

  const rendering = renderArticle(shell, "Langsamer_Artikel");
  await vi.advanceTimersByTimeAsync(7_999);
  expect(shell.main.querySelector<HTMLElement>(".article-loading-notice")?.hidden).toBe(true);

  await vi.advanceTimersByTimeAsync(1);
  const notice = shell.main.querySelector<HTMLElement>(".article-loading-notice");
  expect(notice?.hidden).toBe(false);
  expect(notice?.textContent).toContain("Das Laden dauert länger als üblich");
  expect(notice?.querySelector<HTMLAnchorElement>('a[href*="de.wikipedia.org/wiki/Langsamer_Artikel"]')).not.toBeNull();

  notice?.querySelector<HTMLButtonElement>(".retry")?.click();
  await vi.advanceTimersByTimeAsync(0);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect((fetchMock.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(true);

  second.reject(new Error("offline"));
  first.reject(new Error("stale offline"));
  await rendering;
  await vi.advanceTimersByTimeAsync(0);
});

test("fetched German content replaces the skeleton before model initialization finishes", async () => {
  const model = deferred<void>();
  engine.initModel.mockReturnValue(model.promise);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(articleResponse("Sofort", "Deutscher Artikelinhalt")));
  history.replaceState(null, "", "/wiki/Sofort");
  const shell = createShell();

  const rendering = renderArticle(shell, "Sofort");
  await vi.waitFor(() => expect(shell.main.querySelector(".wiki-content")?.textContent).toContain("Deutscher Artikelinhalt"));

  expect(shell.main.querySelector("[data-article-loading-skeleton]")).toBeNull();
  expect(shell.main.getAttribute("aria-busy")).toBeNull();
  expect(shell.main.querySelector("[data-article-enter]")).not.toBeNull();
  expect(shell.status.textContent).toContain("ÜBERSETZUNG WIRD VORBEREITET");

  model.reject(new Error("model unavailable"));
  await rendering;
});

test("retained article initialization resumes when its replacement fails", async () => {
  const model = deferred<void>();
  const replacement = deferred<Response>();
  engine.initModel.mockReturnValue(model.promise);
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(articleResponse("Erster", "Der erste Artikel bleibt."))
    .mockImplementationOnce(() => replacement.promise));
  history.replaceState(null, "", "/wiki/Erster");
  const shell = createShell();

  const firstRendering = renderArticle(shell, "Erster");
  await vi.waitFor(() => expect(shell.main.querySelector(".wiki-content")?.textContent).toContain("Der erste Artikel bleibt."));
  expect(shell.main.querySelector(".article-view")?.hasAttribute("disabled")).toBe(true);

  history.pushState(null, "", "/wiki/Zweiter");
  const replacementRendering = renderArticle(shell, "Zweiter");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  replacement.reject(new Error("offline"));
  await replacementRendering;

  model.resolve();
  await firstRendering;
  expect(domTranslator.create).toHaveBeenCalledOnce();
  expect(domTranslator.controller.start).toHaveBeenCalledOnce();
  expect(shell.main.querySelector(".article-view")?.hasAttribute("disabled")).toBe(false);
  expect(shell.status.querySelector(".article-status .progress")).not.toBeNull();
});

test("a newer navigation wins when an aborted request resolves late", async () => {
  const first = deferred<Response>();
  const second = deferred<Response>();
  const fetchMock = vi.fn<FetchLike>()
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => second.promise);
  vi.stubGlobal("fetch", fetchMock);
  const shell = createShell();

  history.replaceState(null, "", "/wiki/Erster");
  const firstRendering = renderArticle(shell, "Erster");
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  history.replaceState(null, "", "/wiki/Zweiter");
  const secondRendering = renderArticle(shell, "Zweiter");
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

  expect((fetchMock.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(true);
  second.resolve(articleResponse("Zweiter", "Der zweite Artikel gewinnt."));
  await secondRendering;
  expect(shell.main.querySelector(".wiki-content")?.textContent).toContain("Der zweite Artikel gewinnt.");

  first.resolve(articleResponse("Erster", "Dieser Inhalt ist veraltet."));
  await firstRendering;
  expect(shell.main.querySelector(".wiki-content")?.textContent).toContain("Der zweite Artikel gewinnt.");
  expect(shell.main.textContent).not.toContain("Dieser Inhalt ist veraltet.");
});

test("a stale failure cannot replace the newer article with an error", async () => {
  const first = deferred<Response>();
  const second = deferred<Response>();
  vi.stubGlobal("fetch", vi.fn()
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => second.promise));
  const shell = createShell();

  const firstRendering = renderArticle(shell, "Erster");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  const secondRendering = renderArticle(shell, "Zweiter");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  second.resolve(articleResponse("Zweiter", "Aktueller Inhalt"));
  await secondRendering;

  first.reject(new Error("late failure"));
  await firstRendering;
  expect(shell.main.querySelector(".error-view")).toBeNull();
  expect(shell.main.querySelector(".wiki-content")?.textContent).toContain("Aktueller Inhalt");
});
