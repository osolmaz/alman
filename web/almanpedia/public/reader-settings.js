/*
 * Applies the saved text size and colour mode before first paint, so a visitor
 * who chose dark or large text does not see the default flash past.
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
