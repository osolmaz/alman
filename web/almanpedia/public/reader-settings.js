/*
 * Applies the saved text size and colour mode before first paint, so a visitor
 * who chose dark or large text does not see the default flash past, and declares
 * the language the page is about to be built in, so the first frame is not
 * announced as German when it is English.
 *
 * A file rather than an inline script because the Content-Security Policy in
 * public/_headers allows script-src 'self' and no inline execution; inline, this
 * ran in development and was blocked in production, where it matters.
 */
try {
  var settings = JSON.parse(localStorage.getItem("almanpedia:reader-settings:v1"));
  if (settings && settings.version === 1) {
    if (["small", "standard", "large"].indexOf(settings.textSize) !== -1) {
      document.documentElement.dataset.textSize = settings.textSize;
    }
    if (["auto", "light", "dark"].indexOf(settings.colorMode) !== -1) {
      document.documentElement.dataset.colorMode = settings.colorMode;
    }
  }
} catch {}

/* Same order as the app: the address names a language, then the preference does. */
try {
  var asked = new URLSearchParams(location.search).get("lang");
  var chosen = ["de", "en"].indexOf(asked) !== -1 ? asked : localStorage.getItem("almanpedia:locale:v1");
  if (["de", "en"].indexOf(chosen) !== -1) document.documentElement.lang = chosen;
} catch {}
