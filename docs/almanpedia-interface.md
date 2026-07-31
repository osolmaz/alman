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

## The staged figure

The figure stands at the top of the landing page, in place of the large brand heading that used to open it: its first act is that brand at the same size, which then clears the stage for the rest. It carries no frame and no fill of its own, so it reads as the page's masthead rather than an embedded player, and one fixed stage height keeps every act from moving the page. Because the stage is hidden from assistive technology, the page's `h1` is text that names the site and is not shown. The figure runs 101 seconds in six acts, with a play button, a scrubber, chapter markers, and a speed control that cycles 1×, 1.5×, 2×, and 0.5×. It holds its first frame until the stage is a third on screen, then plays by itself. It is deliberately slow: every caption is a sentence that has to be readable before the next one replaces it, no caption is replaced inside 2.4 seconds, and the reading head spends four seconds on a line. Anyone who would rather not wait has 2× and the chapter markers. The example article throughout is `Sapir-Whorf-Hypothese`, and its text is the real lede of that German Wikipedia article shortened to four sentences.

Its Alman side is not written by hand. It is recorded from GoePT-1-20M itself, through the pinned `@huggingface/transformers` adapter over a digest-verified local copy of the package, with the generation parameters in `MODEL_PACKAGE` — the same path the parity gate in `core/test/model-node.test.ts` uses. The safe translator passes model output through verbatim, so what the figure shows is what a visitor reading the real article gets. Where the specification allows two forms and the model picks one, the figure follows the model: `die` rather than the preferred `das` as the relativizer (§6f), the periphrastic `von die` rather than the retained genitive `der` (§1d beside §1b), and the natural-gender `es` and `sein` for inanimate referents (§6a, §7c). A test pins this text; if the production model changes, it is meant to be re-recorded rather than hand-edited, because the figure claims to show what this product does.

1. The brand appears while a progress bar fills for the one-time 34 MB model download.
2. A browser address bar changes the four letters `wiki` to `alman` in `de.wikipedia.org/wiki/Sapir-Whorf-Hypothese`, presses Enter, and opens the article in German.
3. A reading head sweeps one line at a time, and **every** word that changes turns over as the band passes its own column — articles, endings, possessives and pronouns alike. Each one shakes while it waits, with the shake tightening as the band closes in, and bursts as the band arrives. A line is therefore fully Alman as soon as the head leaves it, and the page's language badge changes from `de` to `de-AL` once the last line is done.

   An earlier version held the subtler changes back until the whole page had been read. It left one of the four sentences untouched for twenty seconds and the page looking half-translated for most of the act, which read as a defect rather than as staging.

   The timing comes from one measurement: where each word sits across its line, as a fraction. The band is 30% of the line wide and its keyframe is written so its centre travels linearly from 0% to 100%, which makes that fraction a plain multiple of the sweep duration — the wait before a word's burst, and the length of its shake. The measurement is the only one in the figure, and it is safe because no box ever resizes; it runs again after the webfonts load and on any width change.
4. The five definite article forms of Standard German converge and collapse into `die`, followed by the genitive `der` that Alman keeps.
5. `der Mann`, `die Frau`, and `das Kind` take the same article. A form that Standard German and Alman spell alike gets no burst, only a nod.
6. Six cards show the ending rules, each dropping or adding its ending: §10, §4a, §1b, §3a, §1f, and §3f.

The timeline is a list of cues on a clock rather than a sequential script, so every point in it is reachable. Seeking resets the stage and replays every cue up to the target with transitions and keyframes suppressed. Two rules hold this together and neither is enforced by the engine: every cue sets its state outright, and the reset clears everything any cue can set. A one-shot effect is therefore a state that carries a keyframe animation followed by a settled state that carries none. The engine writes the playback rate to a `--rate` custom property on the stage, and every duration in the stylesheet divides by it, so slowing the scene slows the motion with it.

Nothing in the figure changes size when a word changes. Both spellings of a changed word share one grid cell, so the box is always as wide as the longer of the two, with the slack left after the word where it merges with the following space, and an ending that falls away or arrives has a reserved cell of its own. Sizing each box to whichever spelling is showing reads better, but then every turnover shifts the words after it and re-wraps the line, and the paragraph appears to twitch. The browser frame likewise keeps one width across all acts. The stage keeps one height for the same reason. This is worth a note because the obvious implementations — collapsing a width, or an inline-block with clipped overflow — both move the surrounding text, and the second also moves the baseline.

On phones the figure keeps one flat height of 34rem rather than a viewport-relative one. The article act is the tallest, and it grows as the viewport narrows: measured at 446 pixels tall at a 320-pixel viewport, 427 at 360 and 390, and 388 at 430. A height that scaled with the viewport would give the least room exactly where the most is needed, which is what clipped the last line of the article on every phone before this. The transport controls grow at the same breakpoint: the play button to 44 by 44, and the scrubber to a 36-pixel box whose bar stays thin because it is painted as a centred background rather than sized by the box. The five article chips take their geometry from their own type size, so the row is always 19.6em wide and their gaps never change; the type size is what adapts, at 4vw, which is the largest that keeps the row inside the page on a 320-pixel screen.

The stage is hidden from assistive technology, contains no focusable element, and never carries the meaning alone: the prose beside it states the address replacement, the model size, and the six ending rules with their specification references. Its transport controls stay outside the hidden subtree with their own labels.

Adjacent copy carries the address-replacement instructions, search option, model size, first-download size, and local-inference explanation. GoePT-1-20M links to its public Hugging Face repository.

Below that guide, the landing page fetches the current German Wikipedia homepage and presents its daily article, current events, news, recent deaths, facts, and sister projects in a responsive two-column layout. These sections use the same local model, full-speed queue, and viewport reveal behavior as articles. The German Wikipedia welcome box is omitted because the Almanpedia introduction replaces it.

The CSS is maintained in `web/almanpedia/src/styles/base.css` and `web/almanpedia/src/styles/wiki-content.css`. It is an independent implementation using Wikipedia-like proportions and colors. The bundle excludes Vector stylesheets and inactive Wikimedia controls. Almanpedia's name, model status, source links, and license notice remain visible.

The brand uses one raster emblem and one vector lettering asset. The full 973 by 717 PNG lives under `web/almanpedia/public/brand/`, with smaller brand images from 96 through 384 pixels for responsive loading. Every brand PNG contains no metadata or trailing bytes. The SVG uses outlined glyphs from Wikimedia's modified `LinLibertine_Re-4.7.3.otf`, the official Wikipedia wordmark face. The first and last letters use full capitals, while the middle uses the font's optically corrected small caps. Its subtitle is also made from outlined paths, spans the same visual width, and has a larger gap below the wordmark. The SVG has no rendered text or font dependency. Alternative text preserves both lines for assistive technology. The landing page shows the same assets stacked as the opening act of its figure. Raster browser icons use the same emblem.

Generated contents links use the source heading IDs. Their labels refresh after translation and when the visitor changes between German and Alman. Comparison clones namespace their own IDs while canonical fragment URLs remain unchanged.

## Accessibility and performance

Settings use native radio buttons and checkboxes in labelled groups. The panel stays visible in the right column on wide screens and becomes a closable overlay at narrower widths. Translation status remains available through the header's status region. The source language stays `de` while model work is incomplete, while translated blocks still wait for reveal, or while the German layer is selected. The article uses `de-AL` after model work is complete and every stored translation has been revealed.

The light animation continues through queued work and stored ready work, including the active model block. Revealed blocks receive a short-lived marker, which prevents a settings change from replaying effects across the whole article. Full-article scheduling raises every article block to the inference queue while the worker keeps one bounded inference stream.
