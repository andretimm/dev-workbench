import { describe, expect, it } from "vitest";
import { convertAllBases, parseInBase } from "./base";

describe("parseInBase", () => {
  it("parses valid digits per base", () => {
    expect(parseInBase("1010", 2)).toBe(10n);
    expect(parseInBase("17", 8)).toBe(15n);
    expect(parseInBase("255", 10)).toBe(255n);
    expect(parseInBase("ff", 16)).toBe(255n);
    expect(parseInBase("FF", 16)).toBe(255n);
  });

  it("rejects digits invalid for the base", () => {
    expect(parseInBase("12", 2)).toBeNull();
    expect(parseInBase("89", 8)).toBeNull();
    expect(parseInBase("xyz", 16)).toBeNull();
  });

  it("rejects empty input", () => {
    expect(parseInBase("", 10)).toBeNull();
    expect(parseInBase("   ", 10)).toBeNull();
  });
});

describe("convertAllBases", () => {
  it("converts a decimal value to bin/oct/hex", () => {
    expect(convertAllBases("255", 10)).toEqual({ 2: "11111111", 8: "377", 10: "255", 16: "ff" });
  });

  it("converts a hex value to the others", () => {
    expect(convertAllBases("ff", 16)).toEqual({ 2: "11111111", 8: "377", 10: "255", 16: "ff" });
  });

  it("returns blanks for invalid input", () => {
    expect(convertAllBases("not a number", 10)).toEqual({ 2: "", 8: "", 10: "", 16: "" });
  });

  it("handles large values beyond Number.MAX_SAFE_INTEGER via BigInt", () => {
    const big = "123456789012345678901234567890";
    const result = convertAllBases(big, 10);
    expect(result[10]).toBe(big);
    expect(parseInBase(result[16], 16)?.toString(10)).toBe(big);
  });
});
