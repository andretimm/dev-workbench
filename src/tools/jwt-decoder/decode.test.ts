import { describe, it, expect } from "vitest";
import { decodeJwt } from "./decode";

const SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  it("decodes header and payload", () => {
    const result = decodeJwt(SAMPLE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
      expect(result.payload).toEqual({ sub: "1234567890", name: "John Doe", iat: 1516239022 });
    }
  });

  it("flags a token with no exp as not expired", () => {
    const result = decodeJwt(SAMPLE);
    if (result.ok) {
      expect(result.expired).toBe(false);
    }
  });

  it("flags an expired token", () => {
    const header = btoa(JSON.stringify({ alg: "none" }));
    const payload = btoa(JSON.stringify({ exp: 1 })); // 1970, long expired
    const token = `${header}.${payload}.sig`;
    const result = decodeJwt(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expired).toBe(true);
    }
  });

  it("rejects a token without 3 segments", () => {
    const result = decodeJwt("not.a.jwt.token.really");
    expect(result.ok).toBe(false);
  });

  it("rejects malformed base64url segments", () => {
    const result = decodeJwt("not-base64.not-base64.sig");
    expect(result.ok).toBe(false);
  });
});
