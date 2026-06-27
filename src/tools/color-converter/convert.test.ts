import { describe, it, expect } from "vitest";
import { parseColor } from "./convert";

describe("parseColor", () => {
  it("parses HEX and derives RGB and HSL", () => {
    const result = parseColor("#ff0000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hex).toBe("#ff0000");
      expect(result.rgb).toBe("rgb(255, 0, 0)");
      expect(result.hsl).toBe("hsl(0, 100%, 50%)");
    }
  });

  it("parses shorthand 3-digit HEX", () => {
    const result = parseColor("#f00");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.hex).toBe("#ff0000");
  });

  it("parses RGB and derives HEX and HSL", () => {
    const result = parseColor("rgb(0, 255, 0)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hex).toBe("#00ff00");
      expect(result.hsl).toBe("hsl(120, 100%, 50%)");
    }
  });

  it("parses HSL and derives HEX and RGB", () => {
    const result = parseColor("hsl(240, 100%, 50%)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hex).toBe("#0000ff");
      expect(result.rgb).toBe("rgb(0, 0, 255)");
    }
  });

  it("rejects an unrecognized format", () => {
    expect(parseColor("not a color").ok).toBe(false);
  });

  it("rejects out-of-range RGB components", () => {
    const result = parseColor("rgb(999, 0, 0)");
    expect(result.ok).toBe(false);
  });

  it("rejects out-of-range HSL values", () => {
    expect(parseColor("hsl(361, 0%, 0%)").ok).toBe(false);
    expect(parseColor("hsl(0, 101%, 0%)").ok).toBe(false);
    expect(parseColor("hsl(0, 0%, 101%)").ok).toBe(false);
  });
});
