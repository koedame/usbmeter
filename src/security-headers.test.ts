/**
 * Pins the production headers (`public/_headers`).
 *
 * Headers are the browser's last line of defence, and nothing visible changes when one is
 * dropped or loosened, so the content is fixed here. Loosen one only together with a test
 * that says why it is needed.
 */

import { describe, expect, it } from "vitest";
import file from "../public/_headers?raw";

/** The `/*` block of `_headers` as { lower-case header name: value }. */
function rootHeaders(): Record<string, string> {
  const lines = file.split("\n");
  const start = lines.indexOf("/*");
  expect(start, "_headers has no /* block").toBeGreaterThanOrEqual(0);
  const headers: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break;
    const at = line.indexOf(":");
    headers[line.slice(0, at).trim().toLowerCase()] = line.slice(at + 1).trim();
  }
  return headers;
}

/** The CSP as { directive: [values...] }. */
function csp(): Record<string, string[]> {
  const policy = rootHeaders()["content-security-policy"] ?? "";
  return Object.fromEntries(
    policy
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...values]) => [name, values]),
  );
}

describe("production headers", () => {
  it("when a rule is added to the policy or a second set of headers to the file, a test has to say why", () => {
    expect(Object.keys(csp()).sort()).toEqual([
      "base-uri",
      "connect-src",
      "default-src",
      "font-src",
      "form-action",
      "frame-ancestors",
      "img-src",
      "object-src",
      "script-src",
      "style-src",
    ]);
    // a path pattern starts its line; the headers under it are indented
    expect(file.split("\n").filter((line) => /^[^\s#]/.test(line))).toEqual(["/*"]);
  });

  it("when the page loads scripts, only the site's own files run (no inline code, no eval)", () => {
    expect(csp()["script-src"]).toEqual(["'self'"]);
  });

  it("when the page opens a connection, it can only reach its own origin (readings never leave the browser)", () => {
    expect(csp()["connect-src"]).toEqual(["'self'"]);
    expect(csp()["default-src"]).toEqual(["'self'"]);
  });

  it("when the page loads styles, images or fonts, only the site's own files are used", () => {
    expect(csp()["style-src"]).toEqual(["'self'"]);
    expect(csp()["img-src"]).toEqual(["'self'"]);
    expect(csp()["font-src"]).toEqual(["'self'"]);
  });

  it("when another site tries to embed the page, it is not shown, and base, plugins and form targets are unusable", () => {
    expect(csp()["frame-ancestors"]).toEqual(["'none'"]);
    expect(csp()["object-src"]).toEqual(["'none'"]);
    expect(csp()["base-uri"]).toEqual(["'none'"]);
    expect(csp()["form-action"]).toEqual(["'none'"]);
  });

  it("when the page asks for a browser feature, none of the listed ones is allowed (Bluetooth is left at its default: the page itself)", () => {
    const features = Object.fromEntries(
      (rootHeaders()["permissions-policy"] ?? "").split(",").map((part) => part.trim().split("=")),
    );
    expect(Object.keys(features)).toEqual(
      expect.arrayContaining(["camera", "microphone", "geolocation"]),
    );
    expect(features).not.toHaveProperty("bluetooth");
    for (const [name, allowlist] of Object.entries(features)) {
      expect(allowlist, `${name} is allowed`).toBe("()");
    }
  });

  it("when the page is opened over HTTP, it is upgraded to HTTPS, and MIME sniffing and referrers are off", () => {
    const headers = rootHeaders();
    expect(headers["strict-transport-security"]).toMatch(/^max-age=\d{8,}/);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("no-referrer");
  });
});
