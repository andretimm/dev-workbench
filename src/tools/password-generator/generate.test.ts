import { describe, expect, it } from "vitest";
import { generatePassword, strengthLabel, DEFAULT_OPTIONS } from "./generate";

describe("generatePassword", () => {
  it("returns correct length", () => {
    const p = generatePassword({ ...DEFAULT_OPTIONS, length: 32 });
    expect(p).toHaveLength(32);
  });

  it("only uppercase when lowercase/numbers/symbols disabled", () => {
    const p = generatePassword({ ...DEFAULT_OPTIONS, lowercase: false, numbers: false, symbols: false });
    expect(p).toMatch(/^[A-Z]+$/);
  });

  it("only numbers when others disabled", () => {
    const p = generatePassword({ ...DEFAULT_OPTIONS, uppercase: false, lowercase: false, symbols: false });
    expect(p).toMatch(/^[0-9]+$/);
  });

  it("generates different passwords on subsequent calls", () => {
    const a = generatePassword(DEFAULT_OPTIONS);
    const b = generatePassword(DEFAULT_OPTIONS);
    expect(a).not.toBe(b);
  });
});

describe("strengthLabel", () => {
  it("weak for short single-type", () => {
    expect(strengthLabel("abc")).toBe("weak");
  });

  it("very-strong for long mixed", () => {
    expect(strengthLabel("Abcd1234!@#$%^&*")).toBe("very-strong");
  });
});
