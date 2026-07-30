// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { createScene, createTransport, type Cue } from "../src/ui/scene";

interface Harness {
  fired: number[];
  state: { value: string };
  scene: ReturnType<typeof createScene>;
  stage: HTMLElement;
  root: HTMLElement;
}

/** A scene whose cues only set state, as the engine's contract requires. */
function harness(): Harness {
  const root = document.createElement("div");
  const stage = document.createElement("div");
  root.append(stage);
  const fired: number[] = [];
  const state = { value: "start" };
  const cues: Cue[] = [
    { t: 100, fn: () => { fired.push(100); state.value = "a"; } },
    { t: 500, fn: () => { fired.push(500); state.value = "b"; } },
    { t: 900, fn: () => { fired.push(900); state.value = "c"; } },
  ];
  const scene = createScene({
    root,
    stage,
    cues,
    durationMs: 1_000,
    reset: () => { state.value = "start"; },
    // No frame source: the tests drive the clock themselves.
  });
  return { fired, state, scene, stage, root };
}

test("cues fire once each as the clock passes them", () => {
  const { fired, state, scene } = harness();

  expect(state.value).toBe("start");
  scene.tick(200);
  expect(fired).toEqual([100]);
  scene.tick(200);
  expect(fired).toEqual([100]);
  scene.tick(200);
  expect(fired).toEqual([100, 500]);
  expect(state.value).toBe("b");
});

test("seeking replays the prefix from a reset, so a target time has one state", () => {
  const { state, scene } = harness();

  scene.seekTo(950);
  expect(state.value).toBe("c");
  scene.seekTo(300);
  expect(state.value).toBe("a");
  scene.seekTo(950);
  expect(state.value).toBe("c");
  scene.seekTo(0);
  expect(state.value).toBe("start");
});

test("seeking suppresses transitions while the prefix is applied", () => {
  const { scene, stage } = harness();
  let seenDuringReset: boolean | undefined;

  const root = document.createElement("div");
  const probeStage = document.createElement("div");
  root.append(probeStage);
  const probe = createScene({
    root,
    stage: probeStage,
    cues: [{ t: 10, fn: () => (seenDuringReset = probeStage.classList.contains("is-seeking")) }],
    durationMs: 100,
    reset: () => {},
  });

  probe.seekTo(50);
  expect(seenDuringReset).toBe(true);
  expect(probeStage.classList.contains("is-seeking")).toBe(false);
  expect(stage.classList.contains("is-seeking")).toBe(false);
  expect(scene.time()).toBe(0);
});

test("the clock loops back to the start at the end of the scene", () => {
  const { fired, scene } = harness();

  scene.tick(999);
  expect(fired).toEqual([100, 500, 900]);
  scene.tick(10);
  expect(scene.time()).toBe(0);
  scene.tick(200);
  expect(fired).toEqual([100, 500, 900, 100]);
});

test("the rate button scales the clock and publishes --rate for the stylesheet", () => {
  const root = document.createElement("div");
  const stage = document.createElement("div");
  root.append(stage);
  const rate = document.createElement("button");
  const scene = createScene({
    root,
    stage,
    cues: [],
    durationMs: 10_000,
    reset: () => {},
    rate,
    rates: [1, 2],
  });

  expect(stage.style.getPropertyValue("--rate")).toBe("1");
  expect(rate.textContent).toBe("1×");
  scene.tick(100);
  expect(scene.time()).toBe(100);

  rate.click();
  expect(stage.style.getPropertyValue("--rate")).toBe("2");
  expect(rate.textContent).toBe("2×");
  scene.tick(100);
  expect(scene.time()).toBe(300);
});

test("the scrubber seeks and reports the played fraction back", () => {
  const root = document.createElement("div");
  const stage = document.createElement("div");
  root.append(stage);
  const seek = document.createElement("input");
  seek.type = "range";
  seek.max = "1000";
  const times: number[] = [];
  const scene = createScene({
    root,
    stage,
    cues: [],
    durationMs: 20_000,
    reset: () => {},
    seek,
    onTime: (ms) => times.push(ms),
  });

  seek.value = "250";
  seek.dispatchEvent(new Event("input"));
  expect(scene.time()).toBe(5_000);

  scene.tick(5_000);
  expect(seek.value).toBe("500");
  expect(times.at(-1)).toBe(10_000);
});

test("the pause button reflects playback in data-paused for the stylesheet", () => {
  const root = document.createElement("div");
  const stage = document.createElement("div");
  root.append(stage);
  const toggle = document.createElement("button");
  createScene({ root, stage, cues: [], durationMs: 1_000, reset: () => {}, toggle });

  expect(root.dataset.paused).toBe("true");
  expect(toggle.getAttribute("aria-label")).toBe("Abspielen");
  toggle.click();
  expect(root.dataset.paused).toBe("false");
  expect(toggle.getAttribute("aria-label")).toBe("Pause");
});

test("transport chapters seek to their own time and mark the current one", () => {
  const seeks: number[] = [];
  const transport = createTransport(
    [{ t: 0, label: "Start" }, { t: 500, label: "Mitte" }, { t: 900, label: "Ende" }],
    1_000,
    (ms) => seeks.push(ms),
  );
  const marks = [...transport.element.querySelectorAll<HTMLButtonElement>(".th-chapter")];

  expect(marks.map((mark) => mark.textContent)).toEqual(["Start", "Mitte", "Ende"]);
  marks[1]!.click();
  expect(seeks).toEqual([500]);

  transport.markCurrent(600);
  expect(marks.map((mark) => mark.dataset.current)).toEqual(["false", "true", "false"]);
  expect(marks[1]!.getAttribute("aria-current")).toBe("true");
  expect(transport.element.style.getPropertyValue("--played")).toBe("0.6");

  transport.markCurrent(0);
  expect(marks.map((mark) => mark.dataset.current)).toEqual(["true", "false", "false"]);
});
