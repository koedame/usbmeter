/**
 * index.html carries the page's English text, so that it reads right before the script has
 * run, and src/locales/en.ts carries it again as what the translations are made from. These
 * tests keep the two the same.
 */

import { describe, expect, it } from "vitest";
import page from "../index.html?raw";
import { LOCALES, segments } from "./i18n.ts";
import { en } from "./locales/en.ts";

/**
 * The elements of the page that name a message, as [message name, text in the form of a
 * message]: a child marked data-slot="word" becomes "<word>…</word>". Like the page's script,
 * this takes an element to end at the first closing tag of its kind.
 */
function namedTexts(html: string): [string, string][] {
  return [...html.matchAll(/<([a-z0-9]+)\b[^>]*\sdata-i18n="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/g)].map(
    ([, , key = "", inside = ""]) => [
      key,
      inside
        .replace(
          /<([a-z0-9]+)\b[^>]*\sdata-slot="(\w+)"[^>]*>([\s\S]*?)<\/\1>/g,
          (_, _tag, slot: string, text: string) => `<${slot}>${text}</${slot}>`,
        )
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

  it("when an element names a message, its text is the English message, word for word", () => {
    // every element that names one is looked at, none slips past the pattern above
    expect(texts.length).toBe(page.match(/\sdata-i18n="/g)?.length);
    expect(texts.length).toBeGreaterThan(50);
    for (const [key, text] of texts) expect(text, key).toBe((en as Record<string, string>)[key]);
  });

  it("when a message marks a stretch for an element, the element that shows it has a child of that name", () => {
    for (const [key, text] of texts) {
      const marked = segments((en as Record<string, string>)[key] ?? "").flatMap(
        ({ slot }) => slot ?? [],
      );
      expect(
        segments(text).flatMap(({ slot }) => slot ?? []),
        key,
      ).toEqual(marked);
    }
  });

  it("when the page lists its languages for search engines, they are the languages on offer", () => {
    const listed = /"inLanguage": (\[[^\]]*\])/.exec(page)?.[1] ?? "[]";
    expect(JSON.parse(listed)).toEqual(LOCALES.map(({ tag }) => tag));
  });
});
