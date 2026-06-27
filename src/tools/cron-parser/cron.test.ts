import { describe, expect, it } from "vitest";
import { evaluateCron } from "./cron";

describe("evaluateCron", () => {
  it("rejects expressions without exactly 5 fields", () => {
    const result = evaluateCron("* * * *");
    expect(result.ok).toBe(false);
  });

  it("rejects out-of-range field values", () => {
    const result = evaluateCron("99 * * * *");
    expect(result.ok).toBe(false);
  });

  it("computes the next N runs for 'every minute'", () => {
    const from = new Date("2026-01-01T00:00:00");
    const result = evaluateCron("* * * * *", 3, from);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nextRuns).toHaveLength(3);
      expect(result.nextRuns[0].toISOString()).toBe(new Date("2026-01-01T00:01:00").toISOString());
      expect(result.nextRuns[1].toISOString()).toBe(new Date("2026-01-01T00:02:00").toISOString());
    }
  });

  it("computes the next runs for 'daily at 9:30'", () => {
    const from = new Date("2026-01-01T00:00:00");
    const result = evaluateCron("30 9 * * *", 2, from);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nextRuns[0].toISOString()).toBe(new Date("2026-01-01T09:30:00").toISOString());
      expect(result.nextRuns[1].toISOString()).toBe(new Date("2026-01-02T09:30:00").toISOString());
    }
  });

  it("respects day-of-week (Monday=1) for a weekly schedule", () => {
    const from = new Date("2026-01-01T00:00:00"); // a Thursday
    const result = evaluateCron("0 12 * * 1", 1, from);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nextRuns[0].getDay()).toBe(1);
      expect(result.nextRuns[0].getHours()).toBe(12);
    }
  });

  it("supports step values like */15", () => {
    const from = new Date("2026-01-01T00:00:00");
    const result = evaluateCron("*/15 * * * *", 4, from);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nextRuns.map((d) => d.getMinutes())).toEqual([15, 30, 45, 0]);
    }
  });

  it("produces a human-readable description", () => {
    const result = evaluateCron("30 9 * * *", 1, new Date("2026-01-01T00:00:00"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.description).toBe("minute 30, hour 9, every day of month, every month, every day of week");
  });
});
