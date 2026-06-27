import { describe, expect, it } from "vitest";
import { encodeJwtHS256 } from "./encode";

describe("encodeJwtHS256", () => {
  it("matches the well-known jwt.io HS256 example token", async () => {
    const payload = '{"sub":"1234567890","name":"John Doe","iat":1516239022}';
    const result = await encodeJwtHS256(payload, "your-256-bit-secret");
    expect(result).toEqual({
      ok: true,
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    });
  });

  it("rejects invalid JSON payload", async () => {
    const result = await encodeJwtHS256("not json", "secret");
    expect(result).toEqual({ ok: false, error: "Payload must be valid JSON" });
  });

  it("rejects an empty secret", async () => {
    const result = await encodeJwtHS256("{}", "");
    expect(result).toEqual({ ok: false, error: "Secret is required" });
  });

  it("produces a different signature for a different secret", async () => {
    const a = await encodeJwtHS256("{}", "secret-a");
    const b = await encodeJwtHS256("{}", "secret-b");
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.token).not.toBe(b.token);
  });
});
