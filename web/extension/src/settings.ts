import { browser } from "wxt/browser";

export type SiteRule = "always" | "never";

export interface Settings {
  autoTranslate: boolean;
  uiLanguage: "auto" | "en" | "de" | "al";
  perSite: Record<string, SiteRule>;
}

export const DEFAULT_SETTINGS: Settings = {
  autoTranslate: false,
  uiLanguage: "auto",
  perSite: {},
};

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored["settings"] as Partial<Settings> | undefined) };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await browser.storage.sync.set({ settings: next });
  return next;
}

export async function setSiteRule(origin: string, rule: SiteRule | null): Promise<void> {
  const current = await getSettings();
  const perSite = { ...current.perSite };
  if (rule === null) delete perSite[origin];
  else perSite[origin] = rule;
  await updateSettings({ perSite });
}
