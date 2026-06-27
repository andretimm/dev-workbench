import { describe, expect, it } from "vitest";
import { csvToJson, jsonToCsv } from "./convert";

describe("csvToJson", () => {
  it("converts simple CSV", () => {
    const result = csvToJson("name,age\nAlice,30\nBob,25");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsed = JSON.parse(result.value);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe("Alice");
      expect(parsed[0].age).toBe(30);
    }
  });

  it("returns empty for empty input", () => {
    expect(csvToJson("")).toEqual({ ok: true, value: "" });
  });
});

describe("jsonToCsv", () => {
  it("converts JSON array to CSV", () => {
    const result = jsonToCsv('[{"name":"Alice","age":30}]');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain("name,age");
      expect(result.value).toContain("Alice");
    }
  });

  it("rejects non-array JSON", () => {
    const result = jsonToCsv('{"key":"val"}');
    expect(result.ok).toBe(false);
  });

  it("returns empty for empty input", () => {
    expect(jsonToCsv("")).toEqual({ ok: true, value: "" });
  });
});
