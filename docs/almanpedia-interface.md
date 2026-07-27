# Almanpedia reader interface

Almanpedia is a client-side reader for articles from the German Wikipedia. It preserves the source article's structure and attribution while translating its prose to Alman in the browser. This document records the reader behavior that the web implementation must preserve.

## Article translation

Almanpedia schedules the whole article as soon as the model is ready. Blocks still pass through the model one at a time because one active inference keeps memory use predictable. The browser extension uses the same DOM planner but retains its visible-first scheduling policy.

`createDomTranslator` reports each block through the `onBlockState` callback. The states are `queued`, `translating`, `translated`, `unchanged`, and `failed`. This callback contains no presentation code. Almanpedia maps the state to a data attribute and uses CSS for the visible effect. It also enables the `markChanges` option, which stays off for the browser extension so translated pages do not gain Almanpedia markup.

The progress indicator measures model work across all article blocks. It disappears after the inference queue finishes, even when translated blocks below the viewport still wait for their visual reveal. A visitor may switch between the German source and the Alman rendering while work is pending. Stored translations are then applied in the selected layer without another model call.

## Translation effects

Model work and visual reveal run independently. Almanpedia enables deferred application in the shared DOM controller, so a completed model result can stay stored without changing its live article block. The worker moves directly to the next block and never waits for animation timing. The browser extension keeps immediate application.

Queued blocks show a moving light band. The active model block receives a stronger band and a blue inset edge. A translated block outside the viewport enters the `ready` state and keeps the pending band while its German source remains in the live article. When that block reaches the viewport margin, Almanpedia applies the stored translation and removes it from the reveal queue.

A block reveals only once. Scrolling away and back does not replay the effect. The German source view and the comparison view pause new reveals. Returning to the Alman view restores translations that were already revealed and reveals any ready blocks currently in view.

When a translated block reveals, inserted word runs fade in from a soft blur over 1.05 seconds. Runs start 42 milliseconds apart, with the stagger capped at 336 milliseconds. The runs come from the same `diffWordsWithSpace` result used by the comparison view, so the normal article and the `Änderungen anzeigen` view use one definition of a change. Inline links keep their live DOM element and receive the effect as one unit.

The light bands and word reveal do not hide source text or change layout.

Both effects are enabled by default. The `Darstellung` panel lets visitors disable either effect and stores this versioned record under `almanpedia:reader-settings:v1` in localStorage:

```json
{
  "version": 1,
  "translationWave": true,
  "changeEffects": true
}
```

The effects stay enabled even when the operating system requests reduced motion. A saved selection takes precedence, and translation continues normally when storage is unavailable.

## Page layout

The article page follows the reading structure familiar from Wikipedia. It has a compact wordmark and search header, a serif article title, a sticky contents column on wide screens, a central article column, and a small appearance column. At intermediate widths the appearance column moves behind the `Darstellung` button. At narrow widths the contents become a collapsed in-flow panel and media or infobox floats return to the article column.

The CSS is maintained in `web/almanpedia/src/styles/base.css` and `web/almanpedia/src/styles/wiki-content.css`. It is an independent implementation using Wikipedia-like proportions and colors. The bundle excludes Vector stylesheets and inactive Wikimedia controls. Almanpedia's name, model status, source links, and license notice remain visible.

The brand uses one raster emblem and one vector lettering asset. The full 973 by 717 PNG lives under `web/almanpedia/public/brand/`, with smaller brand images from 96 through 384 pixels for responsive loading. Every brand PNG contains no metadata or trailing bytes. The SVG uses outlined uppercase Libertinus Serif glyphs, with larger first and last letters. Its subtitle is also made from outlined paths and spans the same visual width as the wordmark. The SVG has no rendered text or font dependency. Alternative text preserves both lines for assistive technology. The landing page stacks the same brand assets. Raster browser icons use the same emblem.

Generated contents links use the source heading IDs. Their labels refresh after translation and when the visitor changes between German and Alman. Comparison clones namespace their own IDs while canonical fragment URLs remain unchanged.

## Accessibility and performance

Settings use native checkboxes inside a native `details` control. Translation status remains available through the header's status region. The source language stays `de` while model work is incomplete, while translated blocks still wait for reveal, or while the German layer is selected. The article uses `de-AL` after model work is complete and every stored translation has been revealed.

The light animation continues through queued work and stored ready work, including the active model block. Revealed blocks receive a short-lived marker, which prevents a settings change from replaying effects across the whole article. Full-article scheduling raises every article block to the inference queue while the worker keeps one bounded inference stream.
