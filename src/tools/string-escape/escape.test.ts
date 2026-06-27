import { describe, expect, it } from "vitest";
import { escapeStr, unescapeStr } from "./escape";

describe("JS / JSON mode", () => {
  it("escapes newline", () => {
    expect(escapeStr("a\nb", "js")).toBe("a\\nb");
  });
  it("escapes tab", () => {
    expect(escapeStr("a\tb", "js")).toBe("a\\tb");
  });
  it("escapes backslash", () => {
    expect(escapeStr("a\\b", "js")).toBe("a\\\\b");
  });
  it("unescapes \\n back to newline", () => {
    expect(unescapeStr("a\\nb", "js")).toBe("a\nb");
  });
});

describe("URL mode", () => {
  it("encodes spaces and special chars", () => {
    expect(escapeStr("hello world&foo=bar", "url")).toBe("hello%20world%26foo%3Dbar");
  });
  it("decodes encoded string", () => {
    expect(unescapeStr("hello%20world", "url")).toBe("hello world");
  });
});

describe("HTML mode", () => {
  it("escapes <>&\"'", () => {
    const result = escapeStr(`<div class="a">&'b'</div>`, "html");
    expect(result).toBe("&lt;div class=&quot;a&quot;&gt;&amp;&#39;b&#39;&lt;/div&gt;");
  });
  it("unescapes named entities", () => {
    expect(unescapeStr("&lt;b&gt;&amp;&quot;", "html")).toBe('<b>&"');
  });
  it("unescapes numeric entities", () => {
    expect(unescapeStr("&#65;", "html")).toBe("A");
  });
});

describe("Unicode mode", () => {
  it("escapes non-ASCII chars", () => {
    expect(escapeStr("café", "unicode")).toBe("caf\\u00e9");
  });
  it("leaves ASCII unchanged", () => {
    expect(escapeStr("hello", "unicode")).toBe("hello");
  });
  it("unescapes \\uXXXX", () => {
    expect(unescapeStr("caf\\u00e9", "unicode")).toBe("café");
  });
});
