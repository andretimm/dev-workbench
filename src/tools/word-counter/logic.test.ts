import { describe, expect, it } from "vitest";
import { analyzeText, formatReadingTime } from "./logic";

describe("analyzeText", () => {
  it("returns zeros for empty string", () => {
    const s = analyzeText("");
    expect(s.words).toBe(0);
    expect(s.chars).toBe(0);
  });

  it("counts words correctly", () => {
    expect(analyzeText("hello world foo").words).toBe(3);
    expect(analyzeText("  spaced   out  ").words).toBe(2);
  });

  it("counts chars and chars without spaces", () => {
    const s = analyzeText("hi there");
    expect(s.chars).toBe(8);
    expect(s.charsNoSpaces).toBe(7);
  });

  it("counts paragraphs separated by blank lines", () => {
    expect(analyzeText("a\n\nb").paragraphs).toBe(2);
    expect(analyzeText("a\nb").paragraphs).toBe(1);
  });

  it("counts lines", () => {
    expect(analyzeText("a\nb\nc").lines).toBe(3);
  });

  it("counts sentences", () => {
    expect(analyzeText("Hello! World. Really?").sentences).toBe(3);
  });
});

describe("formatReadingTime", () => {
  it("shows seconds for < 60s", () => {
    expect(formatReadingTime(45)).toBe("45s");
  });
  it("shows minutes for >= 60s", () => {
    expect(formatReadingTime(60)).toBe("1m");
    expect(formatReadingTime(90)).toBe("1m 30s");
  });
});
