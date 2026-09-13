import { LOCALES, browserStorage, currentLocale, localeHref, saveLocale, uiText, type Locale } from "../i18n";
import { el } from "./dom";

/**
 * The language switch: both language codes, the one in force filled in.
 *
 * A choice reloads the document rather than repainting it. The shell, the footer
 * and the head are built once per document, the figure's cue list is written when
 * it is built, and a reader mid-translation has a model in memory, so a reload is
 * both the smaller change and the honest one. The address travels with the choice,
 * which is what makes an English page a link someone can send.
 */
export function createLocaleSwitch(): HTMLElement {
  const t = uiText();
  const options = LOCALES.map((locale) => {
    const option = el("button", {
      type: "button",
      class: "locale-option",
      lang: locale,
      "aria-pressed": String(locale === currentLocale()),
      "aria-label": t.language[locale],
    }, [locale.toUpperCase()]);
    option.addEventListener("click", () => chooseLocale(locale));
    return option;
  });

  return el("div", { class: "locale-switch", role: "group", "aria-label": t.language.label }, options);
}

function chooseLocale(locale: Locale): void {
  if (locale === currentLocale()) return;
  saveLocale(browserStorage(), locale);
  window.location.assign(localeHref(window.location.href, locale));
}
