import { describe, expect, it } from "vitest";
import { decodeHtmlEntities, encodeHtmlEntities } from "./entities";

describe("encodeHtmlEntities", () => {
  it("escapes the five reserved chars", () => {
    expect(encodeHtmlEntities(`<a href="x">it's</a> & more`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;it&#39;s&lt;/a&gt; &amp; more",
    );
  });

  it("leaves plain text untouched", () => {
    expect(encodeHtmlEntities("hello world")).toBe("hello world");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named entities", () => {
    expect(decodeHtmlEntities("&lt;b&gt;hi&lt;/b&gt; &amp; &quot;there&quot;")).toBe('<b>hi</b> & "there"');
  });

  it("decodes decimal and hex numeric entities", () => {
    expect(decodeHtmlEntities("&#65;&#x42;")).toBe("AB");
  });

  it("round-trips through encode/decode", () => {
    const original = `<tag attr="val">it's & "quoted"</tag>`;
    expect(decodeHtmlEntities(encodeHtmlEntities(original))).toBe(original);
  });

  it("leaves unknown entity-like text untouched", () => {
    expect(decodeHtmlEntities("a &notreal; b")).toBe("a &notreal; b");
  });
});
