import { describe, expect, it } from "vitest";
import { formatSql } from "./format";

describe("formatSql", () => {
  it("formats a simple SELECT", () => {
    const result = formatSql("select id,name from users where id=1", "sql");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain("SELECT");
      expect(result.value).toContain("FROM");
      expect(result.value).toContain("WHERE");
    }
  });

  it("uppercases keywords", () => {
    const result = formatSql("select * from t", "sql");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatch(/SELECT/);
  });

  it("returns ok:true with empty string for empty input", () => {
    expect(formatSql("", "sql")).toEqual({ ok: true, value: "" });
    expect(formatSql("   ", "sql")).toEqual({ ok: true, value: "" });
  });

  it("handles multiple statements", () => {
    const result = formatSql("select 1; select 2;", "sql");
    expect(result.ok).toBe(true);
  });

  it("works with postgresql dialect", () => {
    const result = formatSql("select id::text from users", "postgresql");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toContain("::");
  });

  it("works with mysql dialect", () => {
    const result = formatSql("select `id` from `users`", "mysql");
    expect(result.ok).toBe(true);
  });
});
