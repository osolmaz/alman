import { defineConfig } from "wxt";

export default defineConfig({
  // ES-format workers let Vite emit the ORT WASM as a separate asset instead
  // of inlining ~24MB of base64 into the worker bundle.
  vite: () => ({ worker: { format: "es" as const }, build: { assetsInlineLimit: 0 } }),
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Alman Übersetzer",
    description:
      "Übersetzt deutsche Webseiten in Alman — die vereinfachte Fassung des Deutschen ohne grammatisches Geschlecht. Läuft vollständig lokal im Browser.",
    permissions: ["storage", "scripting", "activeTab", "alarms", ...(browser === "firefox" ? [] : ["offscreen"])],
    ...(browser === "firefox"
      ? { optional_permissions: [], host_permissions: ["<all_urls>"] }
      : { optional_host_permissions: ["<all_urls>"] }),
    action: {},
    icons: {
      16: "/icon/16.png",
      32: "/icon/32.png",
      48: "/icon/48.png",
      128: "/icon/128.png",
    },
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    browser_specific_settings:
      browser === "firefox" ? { gecko: { id: "translator@alman.ai", strict_min_version: "128.0" } } : undefined,
  }),
});
