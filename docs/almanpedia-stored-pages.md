# Stored Almanpedia pages

This document proposes a storage and delivery system for crawlable Almanpedia articles.

## Purpose

Almanpedia currently fetches German Wikipedia in the browser and translates the article after the application loads. This works for readers with JavaScript, but a crawler cannot be expected to run the application, download the model, and wait for translation to finish.

A crawlable article must include Alman text in its first HTTP response. Almanpedia can provide that response by saving completed article snapshots and serving them from the normal `/wiki/<title>` URL. Humans and crawlers should receive the same document.

## Proposed system

Stored pages should be an asynchronous extension of the existing browser application. Translation stays out of the request path.

An edge request handler performs the following lookup:

| Snapshot state | Response |
| --- | --- |
| Ready | Return the stored Alman HTML |
| Stale | Return the previous Alman HTML and request a refresh |
| Missing | Return the current SPA and request generation |
| Failed | Return the current SPA and retain the failure record |

Only ready snapshots belong in the sitemap. This prevents crawlers from discovering a URL before Alman text is available there. A direct request for an uncached article still works through the existing browser translator.

Cloudflare R2 should hold the immutable artifacts. A small D1 catalog should map titles and aliases to the current artifact, track generation state, and deduplicate work. Generation requests can pass through a queue so a burst of visits to one article produces one job.

## Stored artifacts

A snapshot is identified by the Wikipedia page ID, the source revision, the model revision, and the rendering revision. These values keep source changes separate from model or site changes.

A suitable object layout is:

```text
snapshots/<page-id>/<source-revision>/<model-revision>/page.html
snapshots/<page-id>/<source-revision>/<model-revision>/page.md
snapshots/<page-id>/<source-revision>/<model-revision>/article.json
snapshots/<page-id>/<source-revision>/<model-revision>/manifest.json
```

`page.html` is the complete document served to browsers and crawlers. `page.md` is a plain article edition for machine readers. `article.json` holds the translated article payload separately from the site shell so a presentation change can be rendered again without repeating translation.

The manifest should contain enough provenance to reproduce and audit the page:

```json
{
  "canonicalTitle": "Physiokratie",
  "wikipediaPageId": 12345,
  "wikipediaRevision": 987654321,
  "sourceUrl": "https://de.wikipedia.org/wiki/Physiokratie",
  "modelRepository": "osolmaz/GoePT-1-20M",
  "modelRevision": "5f8145012d666bc68b48bd0d89d47847fc950d90",
  "runtimePolicyRevision": "1",
  "rendererRevision": "<git revision>",
  "translatedBlocks": 84,
  "failedBlocks": 0,
  "generatedAt": "<ISO 8601 timestamp>",
  "htmlSha256": "<SHA-256>"
}
```

The generator should read the model repository and revision directly from `MODEL_PACKAGE`. The example above records the current values only to show the resulting manifest.

The D1 catalog needs one current record per Wikipedia page ID and title aliases that resolve to it. Publication updates the current record only after every artifact has been uploaded and checked. Previous immutable objects remain available for audit and rollback.

## Snapshot generation

The generator should use the same article and translation code as Almanpedia:

1. Resolve the requested title and fetch canonical Parsoid HTML.
2. Record the Wikipedia page ID and exact source revision.
3. Sanitize and rewrite the article with the existing Almanpedia functions.
4. Translate with the package pinned in `web/core/src/model/manifest.ts`.
5. Wait until the DOM translation queue is empty.
6. Apply all completed reveals before serialization.
7. Render HTML, Markdown, the article payload, and the manifest.
8. Validate the artifacts and publish them under immutable keys.
9. Move the D1 current pointer to the new snapshot in one transaction.

The first generator should run Almanpedia in a persistent headless Chromium process. That path uses the deployed WASM runtime and the live DOM projection code, which keeps stored output aligned with browser output. Reusing one browser process also avoids downloading and initializing the model for each article.

A Node renderer may later replace Chromium if it is materially faster. It must first prove exact text and DOM agreement on a representative set that includes links, inline formatting, foreign-language spans, tables and lists, plus redirected titles. A metric lead alone cannot authorize a different rendering path when its output differs.

## Publication gates

A snapshot is ready only when all of these checks pass:

- The source page ID, canonical title, and revision are known.
- The model and runtime revisions are pinned.
- Every eligible block reaches a terminal state.
- No required block has a timeout, rejected model output, or unsafe DOM projection.
- The serialized document contains the translated heading and article body.
- Internal article links still resolve through Almanpedia.
- Protected controls and citations retain their intended text, as do foreign-language spans.
- The HTML and manifest hashes match the uploaded objects.
- A no-JavaScript request includes the article text in its response.

Pages with failed blocks remain available through browser translation but stay out of the stored-page sitemap. The failure record should include block state and projection detail so the page can be regenerated after the underlying defect is fixed.

## Serving stored pages

A Cloudflare Pages Function under the `/wiki/*` route can resolve the requested title through D1 and read the current HTML object from R2. A miss falls through to the existing SPA. R2 objects should use content hashes as ETags, while the logical article URL can use normal CDN caching with explicit invalidation after a pointer change.

Stored HTML should include the article content directly inside `<body>` and set the document language to `de-AL`. It should also include:

```html
<link rel="canonical" href="https://almanpedia.org/wiki/Physiokratie">
<link rel="alternate" hreflang="de" href="https://de.wikipedia.org/wiki/Physiokratie">
<link rel="alternate" type="text/markdown" href="/wiki/Physiokratie.md">
```

The application can hydrate the stored document to provide search, appearance controls, the German view, and difference display. Hydration must preserve the initial article text. Crawler delivery should never depend on user-agent detection.

## Freshness

A scheduled updater should check the source revisions for stored page IDs. When Wikipedia has a newer revision, Almanpedia continues serving the previous valid snapshot while a replacement is generated. The current pointer moves only after the replacement passes the publication gates.

Demand should determine the initial corpus. A miss can enqueue an article after a human opens it, while a seed list covers popular and internally linked pages. Pretranslating all of German Wikipedia would spend substantial compute before there is evidence that crawlers or readers need most of those pages.

The existing browser benchmark measured about 6.4 seconds for a 2,018-word page on the frozen single-threaded WASM path. At that rate, 10,000 similar pages require at least 17.8 hours of serial translation, and 100,000 require at least 7.4 days. Fetching and rendering add more time. Retries and validation add further overhead. The first release should therefore use a bounded seed set and record actual generation throughput before increasing it.

## Attribution

Stored translations are derivative editions of Wikipedia articles. Every page must retain the source article link, exact source revision, article history link, CC BY-SA attribution, and the existing machine-translation notice. The Markdown edition needs the same information because crawlers may consume it without visiting the HTML page.

## Implementation order

The first useful release can stay small:

1. Define and test the snapshot artifact and manifest.
2. Generate a fixed list of articles with the current browser pipeline.
3. Upload immutable objects to R2 and catalog them in D1.
4. Serve ready snapshots from `/wiki/*`, with SPA fallback on a miss.
5. Publish an HTML sitemap and Markdown alternatives for ready pages.
6. Add queued generation and source-revision refresh after the static path is proven.

The initial acceptance check should use `curl` against a stored article. The response must contain the Alman title and paragraphs without running JavaScript. A browser test should then hydrate that same response and confirm that links and controls still work, including the original view.
