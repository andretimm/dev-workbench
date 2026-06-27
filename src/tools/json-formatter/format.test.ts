import { describe, it, expect } from "vitest";
import { formatJson, minifyJson } from "./format";

describe("formatJson", () => {
  it("pretty-prints valid JSON with 2-space indent", () => {
    const result = formatJson('{"a":1,"b":[1,2]}');
    expect(result).toEqual({ ok: true, value: '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}' });
  });

  it("reports an error with line/column for invalid JSON", () => {
    const result = formatJson('{"a": }');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/line \d+/i);
    }
  });
});

describe("minifyJson", () => {
  it("removes all insignificant whitespace", () => {
    const result = minifyJson('{\n  "a": 1\n}');
    expect(result).toEqual({ ok: true, value: '{"a":1}' });
  });

  it("reports the same error shape as formatJson on invalid input", () => {
    const result = minifyJson("not json");
    expect(result.ok).toBe(false);
  });
});
