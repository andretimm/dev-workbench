import { describe, expect, it } from "vitest";
import { formatXml, minifyXml } from "./format";

describe("formatXml", () => {
  it("formats a one-liner into indented XML", () => {
    const result = formatXml(`<root><child attr="1">text</child></root>`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(`<root>\n  <child attr="1">text</child>\n</root>`);
    }
  });

  it("returns ok:true with empty string for empty input", () => {
    expect(formatXml("")).toEqual({ ok: true, value: "" });
    expect(formatXml("   ")).toEqual({ ok: true, value: "" });
  });

  it("returns ok:false for unclosed tag", () => {
    const result = formatXml("<root><unclosed></root>");
    expect(result.ok).toBe(false);
  });

  it("returns ok:false for invalid XML", () => {
    const result = formatXml("<root><a></b></root>");
    expect(result.ok).toBe(false);
  });

  it("preserves attributes", () => {
    const result = formatXml(`<root id="x" class="y"/>`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('id="x"');
      expect(result.value).toContain('class="y"');
    }
  });

  it("self-closes empty elements", () => {
    const result = formatXml("<root><empty/></root>");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toContain("<empty/>");
  });
});

describe("minifyXml", () => {
  it("removes whitespace between tags", () => {
    const result = minifyXml("<root>\n  <child>text</child>\n</root>");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).not.toMatch(/>\s+</);
  });

  it("returns ok:true with empty string for empty input", () => {
    expect(minifyXml("")).toEqual({ ok: true, value: "" });
  });

  it("returns ok:false for malformed XML", () => {
    const result = minifyXml("<open>");
    expect(result.ok).toBe(false);
  });
});
