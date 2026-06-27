import { decodeBase64 } from "@/tools/base64/base64";

export type JwtResult =
  | {
      ok: true;
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      expired: boolean;
    }
  | { ok: false; error: string };

function decodeSegment(segment: string): Record<string, unknown> {
  const result = decodeBase64(segment, true);
  if (!result.ok) throw new Error(result.error);
  return JSON.parse(result.value);
}

export function decodeJwt(token: string): JwtResult {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { ok: false, error: "A JWT must have exactly 3 dot-separated segments (header.payload.signature)" };
  }

  try {
    const header = decodeSegment(parts[0]);
    const payload = decodeSegment(parts[1]);
    const exp = payload.exp;
    const expired = typeof exp === "number" ? Date.now() >= exp * 1000 : false;
    return { ok: true, header, payload, expired };
  } catch (err) {
    return { ok: false, error: `Could not decode token: ${err instanceof Error ? err.message : String(err)}` };
  }
}
