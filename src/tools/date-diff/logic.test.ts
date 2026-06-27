import { describe, expect, it } from "vitest";
import { diffDates } from "./logic";

describe("diffDates", () => {
  it("returns null for invalid dates", () => {
    expect(diffDates("not-a-date", "2024-01-01")).toBeNull();
  });

  it("calculates exact day difference", () => {
    const r = diffDates("2024-01-01", "2024-01-11");
    expect(r?.days).toBe(10);
  });

  it("calculates week difference", () => {
    const r = diffDates("2024-01-01", "2024-01-15");
    expect(r?.weeks).toBe(2);
  });

  it("calculates month difference", () => {
    const r = diffDates("2024-01-01", "2024-04-01");
    expect(r?.months).toBe(3);
  });

  it("calculates year difference", () => {
    const r = diffDates("2020-01-01", "2024-01-01");
    expect(r?.years).toBe(4);
  });

  it("handles reversed order (a > b)", () => {
    const r = diffDates("2024-01-11", "2024-01-01");
    expect(r?.days).toBe(10);
    expect(r?.future).toBe(false);
  });

  it("marks future correctly", () => {
    const r = diffDates("2024-01-01", "2025-01-01");
    expect(r?.future).toBe(true);
  });
});
