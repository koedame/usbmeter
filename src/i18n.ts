// The languages of the page: which one to show, the text in it, and putting that text into
// the page. The texts are in src/locales, one file per language with the same keys.

import { de } from "./locales/de.ts";
import { en, type MessageKey, type Messages } from "./locales/en.ts";
import { es } from "./locales/es.ts";
import { fr } from "./locales/fr.ts";
import { it } from "./locales/it.ts";
import { ja } from "./locales/ja.ts";
import { ko } from "./locales/ko.ts";
import { ptBR } from "./locales/pt-BR.ts";
import { ru } from "./locales/ru.ts";
import { zhHans } from "./locales/zh-Hans.ts";
import { zhHant } from "./locales/zh-Hant.ts";

/** What the page falls back to */
const ENGLISH = { tag: "en", name: "English", messages: en } as const;

/**
 * The languages on offer, in the order of the language list: the tag that goes into
 * <html lang> and into the address (?lang=), and the language's own name for itself.
 */
export const LOCALES = [
  { tag: "de", name: "Deutsch", messages: de },
  ENGLISH,
  { tag: "es", name: "Español", messages: es },
  { tag: "fr", name: "Français", messages: fr },
  { tag: "it", name: "Italiano", messages: it },
  { tag: "pt-BR", name: "Português (Brasil)", messages: ptBR },
  { tag: "ru", name: "Русский", messages: ru },
  { tag: "ja", name: "日本語", messages: ja },
  { tag: "ko", name: "한국어", messages: ko },
  { tag: "zh-Hans", name: "简体中文", messages: zhHans },
  { tag: "zh-Hant", name: "繁體中文", messages: zhHant },
] as const satisfies readonly { tag: string; name: string; messages: Messages }[];

export type Locale = (typeof LOCALES)[number];

/**
 * The page's language for a list of wanted ones, most wanted first, the way a browser gives
 * them in navigator.languages. Undefined when the page has none of them.
 * Regions are passed over (fr-CA gets French, pt-PT Brazilian Portuguese), except that for
 * Chinese the region tells the script: zh-TW and zh-HK read traditional characters.
 */
export function matchLocale(wanted: readonly string[]): Locale | undefined {
  for (const tag of wanted) {
    let asked: Intl.Locale;
    try {
      asked = new Intl.Locale(tag).maximize();
    } catch {
      continue; // not a language tag
    }
    const found = LOCALES.find((ours) => {
      const own = new Intl.Locale(ours.tag).maximize();
      return (
        own.language === asked.language && (own.language !== "zh" || own.script === asked.script)
      );
    });
    if (found) return found;
  }
  return undefined;
}

/**
 * The language to start in: the one the address names (`search` is its "?lang=…" part), else
 * the first of the browser's languages that the page has, else English.
 */
export function startLocale(search: string, wanted: readonly string[]): Locale {
  const named = new URLSearchParams(search).get("lang");
  return matchLocale(named === null ? [] : [named]) ?? matchLocale(wanted) ?? ENGLISH;
}

let current: Locale = ENGLISH;

/** The language the page is in */
export function locale(): Locale {
  return current;
}

export function setLocale(chosen: Locale): void {
  current = chosen;
}

/** The text for `key` in the page's language, with every "{name}" in it replaced from `values` */
export function t(key: MessageKey, values: Record<string, string> = {}): string {
  return current.messages[key].replace(
    /\{(\w+)\}/g,
    (whole, name: string) => values[name] ?? whole,
  );
}

/**
 * A message cut at its "<word>…</word>" pairs: the plain stretches, and the stretches that go
 * into the element the word names (`slot`).
 */
export function segments(message: string): { text: string; slot?: string }[] {
  const parts: { text: string; slot?: string }[] = [];
  let end = 0;
  for (const match of message.matchAll(/<(\w+)>(.*?)<\/\1>/gs)) {
    const [whole, slot = "", text = ""] = match;
    if (match.index > end) parts.push({ text: message.slice(end, match.index) });
    parts.push({ text, slot });
    end = match.index + whole.length;
  }
  if (end < message.length) parts.push({ text: message.slice(end) });
  return parts;
}

/**
 * Puts the text of the page's language into every element under `root` that names its message
 * (data-i18n). Where the message has a "<word>…</word>" pair, that stretch goes into the
 * element's own child marked data-slot="word", which stays the same element, with its
 * listeners. Text only ever enters the page as text, never as markup.
 */
export function translate(root: ParentNode): void {
  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n as MessageKey; // src/page.test.ts fails on one that is no message
    const slots = new Map<string | undefined, HTMLElement>();
    for (const child of element.querySelectorAll<HTMLElement>(":scope > [data-slot]"))
      slots.set(child.dataset.slot, child);
    element.replaceChildren(
      ...segments(t(key)).map(({ text, slot }) => {
        if (slot === undefined) return text;
        const child = slots.get(slot);
        if (!child) throw new Error(`index.html has no element for <${slot}> of "${key}"`);
        child.textContent = text;
        return child;
      }),
    );
  }
}
