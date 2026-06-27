import { describe, it, expect } from "vitest";
import { sha1Hex, sha256Hex } from "./hash";

describe("sha256Hex", () => {
  it("matches the known SHA-256 of 'hello'", async () => {
    const result = await sha256Hex("hello");
    expect(result).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});

describe("sha1Hex", () => {
  it("matches the known SHA-1 of 'hello'", async () => {
    const result = await sha1Hex("hello");
    expect(result).toBe("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
  });
});
