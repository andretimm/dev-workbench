import { describe, it, expect } from "vitest";
import { findMatches } from "./match";

describe("findMatches", () => {
  it("returns matches with index, text, and capture groups", () => {
    const result = findMatches("\\d+", "g", "a1 b22 c333");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches.map((m) => m.text)).toEqual(["1", "22", "333"]);
      expect(result.matches[0].index).toBe(1);
    }
  });

  it("captures named and positional groups", () => {
    const result = findMatches("(?<word>[a-z]+)(\\d+)", "g", "ab12");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches[0].groups).toEqual(["ab", "12"]);
      expect(result.matches[0].namedGroups).toEqual({ word: "ab" });
    }
  });

  it("returns an inline error for an invalid pattern", () => {
    const result = findMatches("(unclosed", "g", "text");
    expect(result.ok).toBe(false);
  });

  it("returns an inline error for invalid flags", () => {
    const result = findMatches("abc", "z", "text");
    expect(result.ok).toBe(false);
  });

  it("returns no matches without throwing when the pattern is empty", () => {
    const result = findMatches("", "g", "text");
    expect(result.ok).toBe(true);
  });

  it("caps results at 10000 matches for a pathological zero-width pattern", () => {
    const testString = "b".repeat(10001);
    const result = findMatches("a*", "g", testString);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches.length).toBe(10000);
    }
  });
});
