import { describe, it, expect } from "vitest";
import { parseTimestamp, dateToTimestamp } from "./convert";

describe("parseTimestamp", () => {
  it("auto-detects seconds for a 10-digit input", () => {
    const result = parseTimestamp("1700000000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe(new Date(1700000000 * 1000).toISOString());
    }
  });

  it("auto-detects milliseconds for a 13-digit input", () => {
    const result = parseTimestamp("1700000000000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe(new Date(1700000000000).toISOString());
    }
  });

  it("respects an explicit unit override", () => {
    const result = parseTimestamp("1700000000000", "seconds");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe(new Date(1700000000000 * 1000).toISOString());
    }
  });

  it("rejects non-numeric input", () => {
    expect(parseTimestamp("not a number").ok).toBe(false);
  });
});

describe("dateToTimestamp", () => {
  it("converts an ISO date string to seconds and milliseconds", () => {
    const iso = "2023-11-14T22:13:20.000Z";
    const result = dateToTimestamp(iso);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seconds).toBe(1700000000);
      expect(result.milliseconds).toBe(1700000000000);
    }
  });

  it("rejects an invalid date string", () => {
    expect(dateToTimestamp("not a date").ok).toBe(false);
  });
});
