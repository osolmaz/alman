/**
 * A seekable timeline for the illustrated scenes on the landing page.
 *
 * A scene is a list of cues on a clock rather than a sequential script, which
 * is what makes any point in it reachable. Seeking resets the scene and replays
 * every cue up to the target with transitions and keyframes suppressed, then
 * playback carries on from there.
 *
 * That only works if two rules hold, and neither is checked for you:
 *
 *   1. Every cue sets state outright. A cue that toggles or increments gives a
 *      different result on the second replay, so scrubbing back and forth would
 *      drift.
 *   2. `reset` clears everything any cue can set. Whatever it misses survives a
 *      seek and leaks into a frame it does not belong in.
 *
 * One-shot effects follow from the same rules: a cue sets a state that carries
 * a keyframe animation, and a later cue sets the settled state that carries
 * none. Seeking past both lands on the settled state without replaying the
 * effect; seeking into the gap plays it, which is what a viewer expects.
 *
 * The clock also drives a `--rate` custom property on the stage, so CSS written
 * as `calc(400ms / var(--rate, 1))` stretches along with the cues instead of
 * staying snappy while the pacing slows down.
 */

import { el } from "./dom";

export type Cue = { t: number; fn: () => void };

/** A seekable point in the scene, offered to the viewer as a marker. */
export type Chapter = { t: number; label: string };

export interface SceneOptions {
  /** Carries `data-paused`, which the transport buttons style themselves from. */
  root: HTMLElement;
  /** Reset between seeks. Gets `.is-seeking` while a jump is applied. */
  stage: HTMLElement;
  /** Cues in ascending time order. */
  cues: Cue[];
  durationMs: number;
  /** Put the scene back to time zero. See rule 2 above. */
  reset: () => void;
  toggle?: HTMLButtonElement | null;
  seek?: HTMLInputElement | null;
  /** Cycles through `rates` on each click, and shows the current one. */
  rate?: HTMLButtonElement | null;
  /** Playback rates to cycle, starting at the first. */
  rates?: number[];
  /** Reported on every painted frame, for chapter and elapsed-time displays. */
  onTime?: (ms: number) => void;
  /** Fraction of the stage on screen before it starts playing by itself. */
  autoplayAt?: number;
  /** Frame source; injectable so tests can drive the clock themselves. */
  raf?: (callback: (now: number) => void) => void;
}

export interface Scene {
  time(): number;
  seekTo(ms: number): void;
  setPlaying(on: boolean): void;
  /** Advance the clock by hand. Playback uses this too. */
  tick(deltaMs: number): void;
}

export function createScene(options: SceneOptions): Scene {
  const { root, stage, cues, durationMs, reset } = options;
  const rates = options.rates?.length ? options.rates : [1, 1.5, 2, 0.5];
  const seekMax = Number(options.seek?.max) || 1000;

  let t = 0;
  let cursor = 0;
  let playing = false;
  let last = 0;
  let rateIndex = 0;

  const advance = () => {
    while (cursor < cues.length && cues[cursor]!.t <= t) cues[cursor++]!.fn();
  };

  const paint = () => {
    if (options.seek) options.seek.value = String(Math.round((t / durationMs) * seekMax));
    options.onTime?.(t);
  };

  function seekTo(target: number): void {
    t = Math.max(0, Math.min(durationMs, target));
    stage.classList.add("is-seeking");
    reset();
    cursor = 0;
    advance();
    // Commit the suppressed styles before transitions come back on.
    void stage.offsetWidth;
    stage.classList.remove("is-seeking");
    paint();
  }

  function setPlaying(on: boolean): void {
    playing = on;
    last = 0;
    root.dataset.paused = String(!on);
    options.toggle?.setAttribute("aria-label", on ? "Pause" : "Abspielen");
  }

  function setRate(index: number): void {
    rateIndex = index % rates.length;
    const rate = rates[rateIndex]!;
    stage.style.setProperty("--rate", String(rate));
    if (options.rate) {
      options.rate.textContent = `${rate}×`;
      options.rate.setAttribute("aria-label", `Geschwindigkeit ${rate}×, klicken zum Wechseln`);
    }
  }

  function tick(deltaMs: number): void {
    t += deltaMs * rates[rateIndex]!;
    if (t >= durationMs) {
      seekTo(0);
      return;
    }
    advance();
    paint();
  }

  function frame(now: number): void {
    // Clamp the step so a backgrounded tab does not skip the whole scene.
    if (playing && last) tick(Math.min(now - last, 120));
    last = now;
    schedule();
  }

  const schedule = () => options.raf?.(frame);

  options.toggle?.addEventListener("click", () => setPlaying(!playing));
  options.seek?.addEventListener("input", () => {
    seekTo((Number(options.seek!.value) / seekMax) * durationMs);
  });
  options.rate?.addEventListener("click", () => setRate(rateIndex + 1));

  setRate(0);
  seekTo(0);
  setPlaying(false);
  schedule();

  // Hold at the first frame until the scene is actually worth watching.
  if (typeof IntersectionObserver === "function") {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          setPlaying(true);
        }
      },
      { threshold: options.autoplayAt ?? 0.35 },
    );
    observer.observe(stage);
  }

  return { time: () => t, seekTo, setPlaying, tick };
}

/** Build the transport row: play/pause, chapter markers, scrubber, speed. */
export function createTransport(
  chapters: Chapter[],
  durationMs: number,
  onSeek: (ms: number) => void,
): {
  element: HTMLElement;
  toggle: HTMLButtonElement;
  seek: HTMLInputElement;
  rate: HTMLButtonElement;
  markCurrent: (ms: number) => void;
} {
  const toggle = el("button", { type: "button", class: "th-play", "aria-label": "Abspielen" });
  const seek = el("input", {
    type: "range",
    class: "th-seek",
    min: "0",
    max: "1000",
    step: "1",
    value: "0",
    "aria-label": "Durch die Szene fahren",
  });
  const rate = el("button", { type: "button", class: "th-rate" }, ["1×"]);

  const marks = chapters.map((chapter) => {
    const button = el("button", { type: "button", class: "th-chapter", "data-at": String(chapter.t) }, [chapter.label]);
    button.addEventListener("click", () => onSeek(chapter.t));
    return button;
  });

  const element = el("div", { class: "th-transport" }, [
    el("div", { class: "th-bar" }, [toggle, seek, rate]),
    el("div", { class: "th-chapters", "aria-label": "Kapitel" }, marks),
  ]);

  const markCurrent = (ms: number) => {
    let active = 0;
    for (const [index, chapter] of chapters.entries()) if (chapter.t <= ms) active = index;
    for (const [index, mark] of marks.entries()) {
      const current = index === active;
      mark.dataset.current = String(current);
      mark.setAttribute("aria-current", current ? "true" : "false");
    }
    element.style.setProperty("--played", String(ms / durationMs));
  };

  return { element, toggle, seek, rate, markCurrent };
}
