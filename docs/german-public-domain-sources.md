# German Public-Domain Text Sources

This guide lists suitable sources for building a redistributable dataset of
German books and related historical texts. It prioritizes explicit reuse
rights, bulk access, reliable metadata, and clean machine-readable text.

Copyright status must be checked for each edition and contributor. A
public-domain original does not automatically make a recent translation,
introduction, annotation, illustration, or transcription public domain.

## Recommended source order

### 1. TextGrid Digital Library

[TextGrid](https://www.textgridrep.org/?lang=en) is the best general starting
point for a German literary corpus. Its Digital Library contains German-language
and German-translated world literature from the beginning of printing into the
20th century, covering roughly 600 authors.

Most texts are available as plain text and TEI-XML. TextGrid's
[shelf export](https://textgridrep.org/docs/shelf) can download a selected
collection as a ZIP with separate metadata and TEI files or as one TEI corpus.
The repository is open access, but the license recorded for each object remains
authoritative.

Use TextGrid for:

- books and other long-form literary works;
- structured author, title, edition, genre, and date metadata;
- bulk TEI or plain-text ingestion;
- a canonical literary collection before adding noisier sources.

### 2. Deutsches Textarchiv

The [Deutsches Textarchiv](https://www.deutschestextarchiv.de/) (DTA), operated
by the Berlin-Brandenburg Academy of Sciences and Humanities, provides a broad
historical corpus centered on German texts from approximately 1600 to 1900. It
includes literature, philosophy, science, newspapers, journals, and other
printed material, often based on first editions.

DTA offers TEI-P5, raw text, page images, metadata, and linguistic annotations.
Its [DTA Base Format](https://deutschestextarchiv.github.io/dtabf/einfuehrung.html)
provides consistent structural markup. Licensing has changed over the life of
the project and varies across core and contributed collections, so retain and
validate the license attached to every downloaded record.

Use DTA for:

- historical and non-fiction coverage beyond canonical literature;
- high-quality transcriptions with document structure;
- original spelling and typography research;
- linguistically annotated text.

### 3. German Wikisource

[German Wikisource](https://de.wikisource.org/) is useful for human-proofread
transcriptions with scans and clear edition provenance. Its
[copyright policy](https://de.wikisource.org/wiki/Wikisource%3AUrheberrecht)
requires hosted texts to be public domain or freely licensed.

Wikisource quality varies by work. Prefer texts marked as fully proofread and
retain the permanent page or revision identifier used for extraction. Wikimedia
APIs and dumps are preferable to scraping rendered pages.

Use Wikisource for:

- proofread editions missing from TextGrid and DTA;
- source scans and page-level provenance;
- laws, historical documents, letters, and shorter works;
- cross-checking transcriptions obtained elsewhere.

### 4. International Project Gutenberg

[Project Gutenberg's German-language shelf](https://www.gutenberg.org/ebooks/bookshelf/38)
is a useful supplementary catalog with plain-text and EPUB downloads. Bulk users
should use its official mirrors and machine-readable catalogs rather than crawl
the main website.

Project Gutenberg determines copyright status primarily under United States
law. Its [license guidance](https://www.gutenberg.org/policy/license) instructs
non-US users to check the law in their own jurisdiction. Extract the underlying
book text, remove Project Gutenberg headers and footers, and avoid representing
a modified text as a Project Gutenberg edition.

Use Project Gutenberg for:

- filling gaps in the three primary sources;
- convenient plain-text editions;
- discovering candidate works through its catalog metadata.

## Source to avoid for redistribution

Do not ingest text from **Projekt Gutenberg-DE** without separate permission.
It is unrelated to the international Project Gutenberg, and its
[terms of use](https://projekt-gutenberg.org/nutzungsbedingungen/) restrict the
provided texts to private use. The age of the underlying work does not override
the site's terms governing its supplied edition and transcription.

## Rights checks

For a conservative European Union public-domain filter, verify that the
copyright term has expired for every relevant contributor. The usual term is 70
years after the contributor's death, calculated from the end of the calendar
year, but exceptions exist. Check at least:

- author;
- translator;
- editor or adapter when the contribution is independently creative;
- illustrator and photographer when images are retained;
- author of an introduction, commentary, or annotations;
- any special rights or license attached to the digital edition.

Prefer records with an explicit public-domain statement or an open license such
as CC0, CC BY, or CC BY-SA. Store the exact statement and source URL instead of
reducing all cases to a Boolean `public_domain` field. This guide is an ingestion
policy, not legal advice.

## Required metadata

Each dataset item should retain enough information to audit its identity,
rights, and processing history:

```text
id
title
author_name
author_birth_year
author_death_year
contributors[]
original_publication_year
edition_publication_year
publisher
language
genre
source_repository
source_url
source_identifier
source_revision
source_format
license
rights_statement
rights_basis
retrieved_at
content_checksum
```

Each contributor should include their role, dates, and rights status. The source
identifier should be a stable repository identifier, not only a mutable URL.

## Text processing policy

Keep the source transcription as the authoritative text. Historical spelling,
punctuation, capitalization, and OCR artifacts are properties of that source and
should not be silently overwritten.

If normalization is useful, publish it as a derived representation and record:

- the normalization software and version;
- the exact transformation configuration;
- whether spelling, typography, hyphenation, or OCR errors changed;
- a checksum of both the source and derived text;
- a mapping back to source pages or structural elements where possible.

Remove repository boilerplate, navigation, licensing wrappers, and scan-only
page furniture without removing book content such as prefaces or footnotes.

## Deduplication

The same work often appears in several repositories and editions. Deduplicate in
two stages:

1. Match bibliographic identity using normalized author, title, publication
   year, publisher, and edition.
2. Compare normalized text fingerprints to distinguish exact duplicates from
   materially different editions.

Do not collapse distinct translations or editions merely because they represent
the same underlying work. Prefer the edition with the clearest rights statement,
best transcription status, richest metadata, and most stable identifier.

## Suggested initial collection

Start with a narrow, auditable release:

1. Export public-domain German works from the TextGrid Digital Library.
2. Add DTA works that expand time period and genre coverage.
3. Fill specific gaps with fully proofread German Wikisource texts.
4. Use international Project Gutenberg only after jurisdiction-specific rights
   checks.
5. Publish a manifest containing every source record, exclusion, license, and
   transformation decision.

This order produces a useful literary core while keeping provenance and reuse
rights reviewable.
