import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzyScore } from "./fuzzy";

describe("fuzzyMatch", () => {
  it("matches when query chars appear in order", () => {
    expect(fuzzyMatch("jsn", "JSON Formatter")).toBe(true);
  });

  it("does not match when chars are out of order", () => {
    expect(fuzzyMatch("nsj", "JSON Formatter")).toBe(false);
  });

  it("matches an empty query against anything", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(fuzzyMatch("JSON", "json formatter")).toBe(true);
  });
});

describe("fuzzyScore", () => {
  it("scores a contiguous match higher than a scattered one", () => {
    const contiguous = fuzzyScore("json", "JSON Formatter");
    const scattered = fuzzyScore("jsn", "JSON Formatter");
    expect(contiguous).toBeGreaterThan(scattered);
  });

  it("scores a prefix match higher than a mid-string match", () => {
    const prefix = fuzzyScore("json", "JSON Formatter");
    const midString = fuzzyScore("form", "JSON Formatter");
    expect(prefix).toBeGreaterThan(midString);
  });

  it("returns -1 for no match", () => {
    expect(fuzzyScore("xyz", "JSON Formatter")).toBe(-1);
  });
});
