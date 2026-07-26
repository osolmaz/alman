/** Message protocol between the model runtime worker and its clients. */

export interface AssetProgress {
  file: string;
  loaded: number;
  total: number;
  overallLoaded: number;
  overallTotal: number;
  phase: "download" | "compile" | "ready";
}

export type WorkerRequest =
  | { type: "init"; assetBaseUrl?: string; wasmBaseUrl: string }
  | { type: "count-tokens"; id: number; text: string }
  | { type: "translate"; id: number; texts: string[] }
  | { type: "dispose" };

export type WorkerResponse =
  | { type: "progress"; progress: AssetProgress }
  | { type: "ready"; coldStartMs: number }
  | { type: "count-tokens-result"; id: number; tokens: number }
  | { type: "translate-result"; id: number; texts: string[] }
  | { type: "error"; id?: number; name: string; message: string };
