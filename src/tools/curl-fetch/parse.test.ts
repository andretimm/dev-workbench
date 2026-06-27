import { describe, expect, it } from "vitest";
import { curlToFetch, fetchToCurl } from "./parse";

describe("curlToFetch", () => {
  it("converts simple GET", () => {
    const r = curlToFetch("curl https://api.example.com");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain("fetch");
      expect(r.value).toContain("api.example.com");
    }
  });

  it("converts POST with JSON body", () => {
    const r = curlToFetch(`curl -X POST -H "Content-Type: application/json" -d '{"k":"v"}' https://example.com`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain("POST");
      expect(r.value).toContain("Content-Type");
    }
  });

  it("handles multiline with backslash continuation", () => {
    const r = curlToFetch("curl https://api.example.com \\\n  -H 'Authorization: Bearer token'");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toContain("Authorization");
  });

  it("returns error when no URL", () => {
    const r = curlToFetch("curl -X POST");
    expect(r.ok).toBe(false);
  });

  it("returns error for non-curl input", () => {
    const r = curlToFetch("wget https://example.com");
    expect(r.ok).toBe(false);
  });

  it("returns empty for empty input", () => {
    expect(curlToFetch("")).toEqual({ ok: true, value: "" });
  });
});

describe("fetchToCurl", () => {
  it("converts simple fetch GET", () => {
    const r = fetchToCurl(`fetch("https://example.com")`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain("curl");
      expect(r.value).toContain("example.com");
    }
  });

  it("includes method and headers", () => {
    const r = fetchToCurl(`fetch("https://api.com", { method: "POST", headers: { "Content-Type": "application/json" } })`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain("-X POST");
      expect(r.value).toContain("Content-Type");
    }
  });
});
