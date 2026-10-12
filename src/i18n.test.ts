import { describe, expect, it } from "vitest";
import { LOCALES, matchLocale, segments, setLocale, startLocale, t } from "./i18n.ts";
import { en, type MessageKey } from "./locales/en.ts";

const tagFor = (...wanted: string[]) => matchLocale(wanted)?.tag;

describe("matchLocale", () => {
  it("when the browser asks for a language the page has, with or without a region, that language is used", () => {
    expect(tagFor("ja")).toBe("ja");
    expect(tagFor("de-AT")).toBe("de");
    expect(tagFor("fr-CA")).toBe("fr");
    expect(tagFor("es-419")).toBe("es");
    expect(tagFor("en-GB")).toBe("en");
    expect(tagFor("ko-KR")).toBe("ko");
    expect(tagFor("it-CH")).toBe("it");
    expect(tagFor("ru-RU")).toBe("ru");
  });

  it("when the browser asks for Portuguese of any country, the Brazilian text is used", () => {
    expect(tagFor("pt-BR")).toBe("pt-BR");
    expect(tagFor("pt-PT")).toBe("pt-BR");
    expect(tagFor("pt")).toBe("pt-BR");
  });

  it("when the browser asks for Chinese, the region or script decides between simplified and traditional", () => {
    expect(tagFor("zh-CN")).toBe("zh-Hans");
    expect(tagFor("zh-SG")).toBe("zh-Hans");
    expect(tagFor("zh")).toBe("zh-Hans");
    expect(tagFor("zh-TW")).toBe("zh-Hant");
    expect(tagFor("zh-HK")).toBe("zh-Hant");
    expect(tagFor("zh-Hant")).toBe("zh-Hant");
    expect(tagFor("zh-Hans-HK")).toBe("zh-Hans");
  });

  it("when the first language is not on offer but a later one is, the later one is used", () => {
    expect(tagFor("th-TH", "nl", "ja-JP", "en")).toBe("ja");
  });

  it("when English comes before another language of the page, English is used", () => {
    expect(tagFor("en-US", "ja")).toBe("en");
  });

  it("when none of the languages is on offer, or the list is empty or holds something that is no language tag, there is no match", () => {
    expect(tagFor("th-TH", "nl")).toBeUndefined();
    expect(tagFor()).toBeUndefined();
    expect(tagFor("", "C", "not a tag", "en_US.UTF-8")).toBeUndefined();
  });
});

describe("startLocale", () => {
  it("when the browser's languages are not on offer, the page starts in English", () => {
    expect(startLocale("", ["th-TH"]).tag).toBe("en");
  });

  it("when the browser gives no language at all, the page starts in English", () => {
    expect(startLocale("", []).tag).toBe("en");
  });

  it("when the address names a language, it wins over the browser's", () => {
    expect(startLocale("?lang=ja", ["de-DE"]).tag).toBe("ja");
    expect(startLocale("?x=1&lang=zh-Hant", ["de-DE"]).tag).toBe("zh-Hant");
  });

  it("when the address names a language the page does not have, the browser's is used", () => {
    expect(startLocale("?lang=xx", ["de-DE"]).tag).toBe("de");
    expect(startLocale("?lang=", ["de-DE"]).tag).toBe("de");
  });
});

describe("t", () => {
  it("when a text has a place for a value, the value is put there, and a place without a value stays as it is", () => {
    setLocale(LOCALES.find(({ tag }) => tag === "en") ?? LOCALES[0]);
    expect(t("status.reading", { name: "UC96_BLE" })).toBe("Reading from UC96_BLE.");
    expect(t("status.reading")).toBe("Reading from {name}.");
  });

  it("when a value looks like markup or like a place itself, it is put in as it is and not read again", () => {
    setLocale(LOCALES.find(({ tag }) => tag === "en") ?? LOCALES[0]);
    expect(t("status.reading", { name: "<b>{name}</b>" })).toBe("Reading from <b>{name}</b>.");
  });
});

describe("segments", () => {
  it("when a message has no marked stretch, it is one piece of text", () => {
    expect(segments("No data yet")).toEqual([{ text: "No data yet" }]);
  });

  it("when a message marks stretches, they come out in order between the plain text", () => {
    expect(segments("Choose <b>Connect</b>, or <all>list all</all>.")).toEqual([
      { text: "Choose " },
      { text: "Connect", slot: "b" },
      { text: ", or " },
      { text: "list all", slot: "all" },
      { text: "." },
    ]);
  });

  it("when a message starts and ends with a marked stretch, there is no empty text around it", () => {
    expect(segments("<b>Export for AI</b>")).toEqual([{ text: "Export for AI", slot: "b" }]);
  });

  it("when an angle bracket is not part of a pair, it stays in the text", () => {
    expect(segments("below 5 V < 9 V")).toEqual([{ text: "below 5 V < 9 V" }]);
  });
});

// Each translation is checked against the English text it was made from.
describe.each(LOCALES.filter(({ tag }) => tag !== "en"))("the $name text", ({ messages }) => {
  const keys = Object.keys(en) as MessageKey[];
  const places = (text: string) => [...text.matchAll(/\{\w+\}/g)].map(([place]) => place).sort();
  const slots = (text: string) =>
    segments(text)
      .flatMap(({ slot }) => slot ?? [])
      .sort();

  it("when the English text has a place for a value, the translation has the same places", () => {
    for (const key of keys) expect(places(messages[key]), key).toEqual(places(en[key]));
  });

  it("when the English text marks a stretch for an element, the translation marks the same ones and no others", () => {
    for (const key of keys) {
      expect(slots(messages[key]), key).toEqual(slots(en[key]));
      // what is left outside the pairs must not look like markup that was mistyped
      const plain = segments(messages[key])
        .filter(({ slot }) => slot === undefined)
        .map(({ text }) => text)
        .join("");
      expect(plain, key).not.toMatch(/<\/?\w+>/);
    }
  });

  it("when a text is translated, it is not left empty and has no line break or doubled space", () => {
    for (const key of keys) {
      expect(messages[key].trim(), key).not.toBe("");
      expect(messages[key], key).not.toMatch(/\n| {2}|^ | $/);
    }
  });

  it("when the English text names a meter, a Bluetooth name, a file or a product, the translation names it the same way", () => {
    const names =
      /J7-C|UC96_BLE|UD18-BLE|AT24-BLE|UD18|AT24|AT3010|DT24|DT3010|ATorch|0xFFE0|GATT|Web Bluetooth|Bluefy|chrome:\/\/flags\/#enable-experimental-web-platform-features|ChromeOS|Chrome|Edge|Firefox|Safari|Claude|ChatGPT|README|CSV|ZIP|GitHub|MIT|iPhone|iPad|Android|Windows|macOS|Linux|USB Meter Web|koedame/g;
    const named = (text: string) => [...new Set(text.match(names) ?? [])].sort();
    for (const key of keys) expect(named(messages[key]), key).toEqual(named(en[key]));
  });
});

describe("LOCALES", () => {
  it("when a language is on offer, its tag is one that matches itself", () => {
    for (const { tag } of LOCALES) expect(tagFor(tag), tag).toBe(tag);
  });
});
