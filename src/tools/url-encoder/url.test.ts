import { describe, expect, it } from "vitest";
import { decodeUrl, encodeUrl } from "./url";

describe("encodeUrl", () => {
  it("component mode escapes reserved chars like & and =", () => {
    const result = encodeUrl("a=1&b=2 c", true);
    expect(result).toEqual({ ok: true, value: "a%3D1%26b%3D2%20c" });
  });

  it("full-URL mode leaves reserved chars like & and = untouched", () => {
    const result = encodeUrl("https://x.com/p?a=1&b=2 c", false);
    expect(result).toEqual({ ok: true, value: "https://x.com/p?a=1&b=2%20c" });
  });
});

describe("decodeUrl", () => {
  it("decodes percent-encoded component text", () => {
    const result = decodeUrl("a%3D1%26b%3D2%20c", true);
    expect(result).toEqual({ ok: true, value: "a=1&b=2 c" });
  });

  it("round-trips encode/decode", () => {
    const original = "hello world/path?x=1&y=2#frag";
    const encoded = encodeUrl(original, true);
    expect(encoded.ok).toBe(true);
    if (encoded.ok) expect(decodeUrl(encoded.value, true)).toEqual({ ok: true, value: original });
  });

  it("returns an error for malformed percent-encoding", () => {
    const result = decodeUrl("%", true);
    expect(result).toEqual({ ok: false, error: "Invalid URL-encoded input" });
  });
});
