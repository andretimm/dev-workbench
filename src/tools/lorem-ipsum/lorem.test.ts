import { describe, expect, it } from "vitest";
import { generateParagraphs, generateSentence, generateSentences, generateWords } from "./lorem";

describe("generateWords", () => {
  it("generates the requested count of words", () => {
    expect(generateWords(10).split(" ")).toHaveLength(10);
  });

  it("clamps count to at least 1", () => {
    expect(generateWords(0).split(" ")).toHaveLength(1);
  });
});

describe("generateSentence", () => {
  it("starts with a capital letter and ends with a period", () => {
    const sentence = generateSentence();
    expect(sentence[0]).toBe(sentence[0].toUpperCase());
    expect(sentence.endsWith(".")).toBe(true);
  });
});

describe("generateSentences", () => {
  it("generates the requested count of sentences", () => {
    const text = generateSentences(4);
    expect(text.match(/\./g)).toHaveLength(4);
  });
});

describe("generateParagraphs", () => {
  it("generates the requested count of paragraphs", () => {
    expect(generateParagraphs(3)).toHaveLength(3);
  });

  it("each paragraph is non-empty and ends with a period", () => {
    for (const p of generateParagraphs(2)) {
      expect(p.length).toBeGreaterThan(0);
      expect(p.endsWith(".")).toBe(true);
    }
  });
});
