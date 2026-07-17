// Helpers for the localized blog routes.
//
// English posts are canonical and live at src/content/blog/<slug>.md.
// Translations, where they exist, live alongside them as <slug>.de.md and
// <slug>.al.md. Every post gets a route in every locale; untranslated posts
// fall back to the English original with a notice (see BlogPost.astro).

import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "./ui";

const TRANSLATION_ID = /\.(de|al)$/;

/** English (canonical) posts, newest first. */
export async function englishPosts(): Promise<CollectionEntry<"blog">[]> {
  const posts = await getCollection(
    "blog",
    (post) => !TRANSLATION_ID.test(post.id),
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** The translation of a post, or undefined if none exists. */
export async function translatedPost(
  slug: string,
  locale: Locale,
): Promise<CollectionEntry<"blog"> | undefined> {
  if (locale === "en") return undefined;
  // getCollection instead of getEntry: a miss is expected for untranslated
  // posts and should not log a warning during the build.
  const matches = await getCollection(
    "blog",
    (post) => post.id === `${slug}.${locale}`,
  );
  return matches[0];
}

const dateLocales: Record<Locale, string> = {
  en: "en-US",
  de: "de-DE",
  al: "de-DE",
};

export const formatPostDate = (date: Date, locale: Locale): string =>
  date.toLocaleDateString(dateLocales[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
