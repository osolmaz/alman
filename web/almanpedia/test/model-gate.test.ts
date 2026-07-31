// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { autoloadsModel, type DeviceHints } from "../src/ui/model-gate";

const pointers = (matching: string[]): DeviceHints => ({
  matchMedia: (query) => ({ matches: matching.includes(query) }),
});

test("a touch-only device is asked before the model loads", () => {
  expect(autoloadsModel(pointers(["(any-pointer: coarse)"]))).toBe(false);
});

test("a pointer device loads the model as before", () => {
  expect(autoloadsModel(pointers(["(any-pointer: fine)"]))).toBe(true);
  // A laptop with a touchscreen reports both, and is not a phone.
  expect(autoloadsModel(pointers(["(any-pointer: coarse)", "(any-pointer: fine)"]))).toBe(true);
});

test("a device that reports little memory is asked, whatever it points with", () => {
  expect(autoloadsModel({ ...pointers(["(any-pointer: fine)"]), deviceMemory: 4 })).toBe(false);
  expect(autoloadsModel({ ...pointers(["(any-pointer: fine)"]), deviceMemory: 8 })).toBe(true);
});

test("a browser that reports nothing useful loads the model", () => {
  // Being asked costs a press; not being asked cost a phone an endless reload,
  // so the default only applies where there is no signal at all.
  expect(autoloadsModel({})).toBe(true);
  expect(autoloadsModel(pointers([]))).toBe(true);
});
