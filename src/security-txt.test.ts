/**
 * Pins `public/.well-known/security.txt` (RFC 9116), the file where a security researcher
 * learns where to report a vulnerability privately.
 *
 * The file is copied into the build as it is, and the host serves a `.txt` file as plain text.
 * Without it the address would answer 404 and nobody would notice.
 */

import { describe, expect, it } from "vitest";
import file from "../public/.well-known/security.txt?raw";

/** The fields of the file as { lower-case name: value } */
function fields(): Record<string, string> {
  return Object.fromEntries(
    file
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"))
      .map((line) => {
        const at = line.indexOf(":");
        return [line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim()];
      }),
  );
}

describe("security.txt", () => {
  it("when someone looks for where to report a vulnerability, the private reporting form of the repository is named", () => {
    expect(fields().contact).toBe("https://github.com/koedame/usbmeter/security/advisories/new");
  });

  it("when the file is read, it names itself at the address it is served from", () => {
    expect(fields().canonical).toMatch(/^https:\/\/[^/]+\/\.well-known\/security\.txt$/);
  });

  it("when the file is read, its expiry is in the future and at most a year away, so that a stale file is noticed", () => {
    const expires = Date.parse(fields().expires ?? "");
    expect(Number.isNaN(expires), "Expires is missing or not a date").toBe(false);
    const day = 24 * 60 * 60 * 1000;
    expect(expires, "Expires has passed: extend it").toBeGreaterThan(Date.now());
    expect(expires).toBeLessThanOrEqual(Date.now() + 366 * day);
  });
});
