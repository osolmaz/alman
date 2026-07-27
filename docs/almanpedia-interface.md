# Almanpedia reader interface

Almanpedia is a client-side reader for articles from the German Wikipedia. It preserves the source article's structure and attribution while translating its prose to Alman in the browser. This document records the reader behavior that the web implementation must preserve.

## Article translation

Almanpedia schedules the whole article as soon as the model is ready. Blocks still pass through the model one at a time because one active inference keeps memory use predictable. Article and homepage prose is routed as German without per-sentence language detection because it comes from the German Wikipedia REST API. The browser extension uses the same DOM planner but retains its visible-first scheduling and language-detection policies for arbitrary pages.

The shared planner sends only plain rendered prose to the model. It records source ranges for text nodes and inline elements, then projects the plain Alman result back onto the existing DOM with a monotonic word alignment. Links, inline formatting, attributes, listeners, comments, citations, and structural descendants stay as live nodes. Synthetic tags and HTML never enter model input, so incidental markup cannot change the wording or fragment the translation cache. A projection is accepted only when its text exactly matches the model result, remains monotonic, keeps live link labels populated, and still matches the source snapshot. Ambiguous or stale blocks remain unchanged without partial application.

`createDomTranslator` reports each block through the `onBlockState` callback. The states are `queued`, `translating`, `translated`, `unchanged`, and `failed`. This callback contains no presentation code. Almanpedia maps the state to a data attribute and uses CSS for the visible effect. It also enables the `markChanges` option, which stays off for the browser extension so translated pages do not gain Almanpedia markup.

The progress indicator measures model work across all article blocks. It disappears after the inference queue finishes, even when translated blocks below the viewport still wait for their visual reveal. A visitor may switch between the German source and the Alman rendering while work is pending. Stored translations are then applied in the selected layer without another model call. Normal rendering, reveal markers, and the comparison layer all use the same projected text runs. The comparison labels deleted text as the German original and inserted text as Alman. Adjacent deleted and inserted words contain a real separator so the view and copied text never concatenate alternatives such as `im` and `in die`.

## Translation effects

Model work and visual reveal run independently. Almanpedia enables deferred application in the shared DOM controller, so a completed model result can stay stored without changing its live article block. The worker moves directly to the next block and never waits for animation timing. The browser extension keeps immediate application.

Queued blocks show a moving light band. The active model block receives a stronger band and a blue inset edge. A translated block outside the viewport enters the `ready` state and keeps the pending band while its German source remains in the live article. When that block reaches the viewport margin, Almanpedia applies the stored translation and removes it from the reveal queue.

A block reveals only once. Scrolling away and back does not replay the effect. The German source view and the comparison view pause new reveals. Returning to the Alman view restores translations that were already revealed and reveals any ready blocks currently in view.

When a translated block reveals, inserted word runs fade in from a soft blur over 1.05 seconds. Runs start 42 milliseconds apart, with the stagger capped at 336 milliseconds. The runs come from the same `diffWordsWithSpace` result used by the comparison view, so the normal article and the `Änderungen anzeigen` view use one definition of a change. Inline links keep their live DOM element and receive the effect as one unit.

The light bands and word reveal do not hide source text or change layout.

Both effects are enabled by default. The `Erscheinungsbild` panel follows Wikipedia's current text and color controls. Article text ranges from 14 to 20 pixels, with 16 pixels as the standard size. Color can follow the operating-system preference or stay fixed in light or dark mode. The same panel lets visitors disable either translation effect and stores this record under `almanpedia:reader-settings:v1` in localStorage:

```json
{
  "version": 1,
  "translationWave": true,
  "changeEffects": true,
  "textSize": "standard",
  "colorMode": "light"
}
```

The effects stay enabled even when the operating system requests reduced motion. A saved selection takes precedence, and translation continues normally when storage is unavailable.

## Page layout

The article page follows the reading structure familiar from Wikipedia. It has a compact wordmark and search header, a serif article title, a sticky contents column on wide screens, a central article column, and a small appearance column. The title begins the article column without a source kicker above it. At intermediate widths the appearance column moves behind the `Erscheinungsbild` button. At narrow widths the contents become a collapsed in-flow panel and media or infobox floats return to the article column.

The landing page introduces Almanpedia as Alman AI's self-study reader for people learning German without memorizing noun genders. It links directly to the interactive introduction at `alman.ai`.

A browser mockup demonstrates changing `wiki` to `alman` in `de.wikipedia.org`. The animation selects the four letters, types the replacement, opens `de.almanpedia.org`, and ends at the canonical Almanpedia URL before repeating. Adjacent copy restores the address-replacement instructions, search option, model size, first-download size, and local-inference explanation from the original landing page. GoePT-1-20M links to its public Hugging Face repository.

Below that guide, the landing page fetches the current German Wikipedia homepage and presents its daily article, current events, news, recent deaths, facts, and sister projects in a responsive two-column layout. These sections use the same local model, full-speed queue, and viewport reveal behavior as articles. The German Wikipedia welcome box is omitted because the Almanpedia introduction replaces it.

The CSS is maintained in `web/almanpedia/src/styles/base.css` and `web/almanpedia/src/styles/wiki-content.css`. It is an independent implementation using Wikipedia-like proportions and colors. The bundle excludes Vector stylesheets and inactive Wikimedia controls. Almanpedia's name, model status, source links, and license notice remain visible.

The brand uses one raster emblem and one vector lettering asset. The full 973 by 717 PNG lives under `web/almanpedia/public/brand/`, with smaller brand images from 96 through 384 pixels for responsive loading. Every brand PNG contains no metadata or trailing bytes. The SVG uses outlined glyphs from Wikimedia's modified `LinLibertine_Re-4.7.3.otf`, the official Wikipedia wordmark face. The first and last letters use full capitals, while the middle uses the font's optically corrected small caps. Its subtitle is also made from outlined paths, spans the same visual width, and has a larger gap below the wordmark. The SVG has no rendered text or font dependency. Alternative text preserves both lines for assistive technology. The landing page stacks the same brand assets. Raster browser icons use the same emblem.

Generated contents links use the source heading IDs. Their labels refresh after translation and when the visitor changes between German and Alman. Comparison clones namespace their own IDs while canonical fragment URLs remain unchanged.

## Accessibility and performance

Settings use native radio buttons and checkboxes in labelled groups. The panel stays visible in the right column on wide screens and becomes a closable overlay at narrower widths. Translation status remains available through the header's status region. The source language stays `de` while model work is incomplete, while translated blocks still wait for reveal, or while the German layer is selected. The article uses `de-AL` after model work is complete and every stored translation has been revealed.

The light animation continues through queued work and stored ready work, including the active model block. Revealed blocks receive a short-lived marker, which prevents a settings change from replaying effects across the whole article. Full-article scheduling raises every article block to the inference queue while the worker keeps one bounded inference stream.
