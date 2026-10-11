/**
 * index.html carries the page's English text, so that it reads right before the script has
 * run, and src/locales/en.ts carries it again as what the translations are made from. These
 * tests keep the two the same.
 */

import { describe, expect, it } from "vitest";
import page from "../index.html?raw";
import { LOCALES } from "./i18n.ts";
import { en } from "./locales/en.ts";

/** Stands for a tag that is left in an element's text: a character of the private use area, which no message holds */
const STRAY_TAG = "\uE003";

/**
 * The elements of the page that name a message, as [message name, text in the form of a
 * message]: a child marked data-slot="word" becomes "<word>…</word>". Any other tag in the
 * text, also one typed like a mark ("<b>…</b>"), becomes STRAY_TAG: the page's script would
 * find no child for it. Like that script, this takes an element to end at the first closing
 * tag of its kind.
 */
function namedTexts(html: string): [string, string][] {
  return [...html.matchAll(/<([a-z0-9]+)\b[^>]*\sdata-i18n="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/g)].map(
    ([, , key = "", inside = ""]) => [
      key,
      inside
        .replace(
          /<([a-z0-9]+)\b[^>]*\sdata-slot="(\w+)"[^>]*>([\s\S]*?)<\/\1>/g,
          (_, _tag, slot: string, text: string) => `\uE000${slot}\uE001${text}\uE002`,
        )
        .replaceAll("<", STRAY_TAG)
        .replace(/\uE000(\w+)\uE001([\s\S]*?)\uE002/g, "<$1>$2</$1>")
        .replace(/\s+/g, " ")
        .trim()
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&"),
    ],
  );
}

describe("index.html", () => {
  const texts = namedTexts(page);

  it("when an element names a message, its text is the English message, word for word, with every marked stretch in a child that carries its name", () => {
    // every element that names one is looked at, none slips past the pattern above
    expect(texts.length).toBe(page.match(/\sdata-i18n="/g)?.length);
    expect(texts.length).toBeGreaterThan(50);
    for (const [key, text] of texts) expect(text, key).toBe((en as Record<string, string>)[key]);
  });

  it("when the page lists its languages for search engines, they are the languages on offer", () => {
    const listed = /"inLanguage": (\[[^\]]*\])/.exec(page)?.[1] ?? "[]";
    expect(JSON.parse(listed)).toEqual(LOCALES.map(({ tag }) => tag));
  });
});
