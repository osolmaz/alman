import type { AssetProgress, DomTranslationStats } from "@alman/core";

/** RPC served by the inference host (offscreen document on Chrome, background page on Firefox). */
export type HostRequest =
  | { target: "alman-host"; kind: "init" }
  | { target: "alman-host"; kind: "count-tokens"; text: string }
  | { target: "alman-host"; kind: "translate"; requestId: string; deadlineAt?: number; texts: string[] }
  | { target: "alman-host"; kind: "cancel"; requestId: string }
  | { target: "alman-host"; kind: "status" }
  | { target: "alman-host"; kind: "idle-check" };

export type ModelState =
  | { state: "empty" }
  | { state: "downloading"; progress: AssetProgress }
  | { state: "preparing" }
  | { state: "ready" };

/** RPC served by the background router. */
export type BackgroundRequest =
  | { target: "alman-bg"; kind: "ensure-host" }
  | { target: "alman-bg"; kind: "translate-tab"; tabId: number };

/** Commands the popup sends to an injected page translator. */
export type PageCommand =
  | { target: "alman-page"; command: "status" }
  | { target: "alman-page"; command: "translate" }
  | { target: "alman-page"; command: "toggle" };

export interface PageStatus {
  injected: true;
  translating: boolean;
  showingOriginal: boolean;
  stats: DomTranslationStats | null;
}

/** Broadcast events (fire-and-forget). */
export type BroadcastEvent = { type: "alman:model-state"; state: ModelState };
