import { describe, it, expect } from "vitest";
import { encodeBase64, decodeBase64 } from "./base64";

describe("encodeBase64", () => {
  it("encodes ASCII text", () => {
    expect(encodeBase64("hello", false)).toEqual({ ok: true, value: "aGVsbG8=" });
  });

  it("encodes UTF-8 text correctly (not just ASCII)", () => {
    expect(encodeBase64("héllo 🚀", false)).toEqual({ ok: true, value: "aMOpbGxvIPCfmoA=" });
  });

  it("produces a URL-safe variant without padding or +/ characters", () => {
    const result = encodeBase64("subjects?_d>", true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toMatch(/[+/=]/);
    }
  });
});

describe("decodeBase64", () => {
  it("decodes back to the original UTF-8 text", () => {
    expect(decodeBase64("aMOpbGxvIPCfmoA=", false)).toEqual({ ok: true, value: "héllo 🚀" });
  });

  it("decodes the URL-safe variant", () => {
    const encoded = encodeBase64("subjects?_d>", true);
    if (!encoded.ok) throw new Error("setup failed");
    expect(decodeBase64(encoded.value, true)).toEqual({ ok: true, value: "subjects?_d>" });
  });

  it("reports an inline error for invalid base64", () => {
    const result = decodeBase64("not valid base64!!", false);
    expect(result.ok).toBe(false);
  });
});
