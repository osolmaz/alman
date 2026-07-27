# Almanpedia reader interface

Almanpedia is a client-side reader for articles from the German Wikipedia. It preserves the source article's structure and attribution while translating its prose to Alman in the browser. This document records the reader behavior that the web implementation must preserve.

## Article translation

Almanpedia schedules the whole article as soon as the model is ready. Blocks still pass through the model one at a time because one active inference keeps memory use predictable. The browser extension uses the same DOM planner but retains its visible-first scheduling policy.

`createDomTranslator` reports each block through the `onBlockState` callback. The states are `queued`, `translating`, `translated`, `unchanged`, and `failed`. This callback contains no presentation code. Almanpedia maps the state to a data attribute and uses CSS for the visible effect. It also enables the `markChanges` option, which stays off for the browser extension so translated pages do not gain Almanpedia markup.

The progress indicator measures all article blocks. It disappears after the entire queue finishes. A visitor may switch between the German source and the Alman rendering while work is pending. Stored translations are then applied in the selected layer without another model call.

## Translation effects

The block currently passing through inference can show a moving light band. When a translated block appears, inserted word runs can briefly fade in from a soft blur. The word runs come from the same `diffWordsWithSpace` result used by the comparison view, so the normal article and the `Änderungen anzeigen` view use one definition of a change.

The light band never hides the source text or changes layout. The word effect ends after 420 milliseconds. Inline links whose text changes keep their live DOM element and receive the effect as one unit.

Both effects are optional. The `Darstellung` panel stores this versioned record under `almanpedia:reader-settings:v1` in localStorage:

```json
{
  "version": 1,
  "translationWave": true,
  "changeEffects": true
}
```

New visitors inherit the operating system's reduced-motion preference. A saved selection takes precedence. Translation continues normally when storage is unavailable.

## Page layout

The article page follows the reading structure familiar from Wikipedia. It has a compact wordmark and search header, a serif article title, a sticky contents column on wide screens, a central article column, and a small appearance column. At intermediate widths the appearance column moves behind the `Darstellung` button. At narrow widths the contents become a collapsed in-flow panel and media or infobox floats return to the article column.

The CSS is maintained in `web/almanpedia/src/styles/base.css` and `web/almanpedia/src/styles/wiki-content.css`. It is an independent implementation using Wikipedia-like proportions and colors. The bundle excludes Vector stylesheets and inactive Wikimedia controls. Almanpedia's name, model status, source links, and license notice remain visible.

Generated contents links use the source heading IDs. Their labels refresh after translation and when the visitor changes between German and Alman. Comparison clones namespace their own IDs while canonical fragment URLs remain unchanged.

## Accessibility and performance

Settings use native checkboxes inside a native `details` control. Translation status remains available through the header's status region. The source language stays `de` while translation is incomplete or while the German layer is selected. A complete Alman article uses `de-AL`.

Only the active inference block runs the continuous light animation. Completed blocks receive a short-lived reveal marker, which prevents a settings change from replaying effects across the whole article. Full-article scheduling raises every article block to the active queue while the worker keeps one bounded inference stream.
