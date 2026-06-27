export type Base64Result = { ok: true; value: string } | { ok: false; error: string };

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(b64: string): string {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return padded + "=".repeat(padLength);
}

export function encodeBase64(input: string, urlSafe: boolean): Base64Result {
  try {
    const bytes = new TextEncoder().encode(input);
    const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    const b64 = btoa(binary);
    return { ok: true, value: urlSafe ? toUrlSafe(b64) : b64 };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function decodeBase64(input: string, urlSafe: boolean): Base64Result {
  try {
    const standard = urlSafe ? fromUrlSafe(input) : input;
    const binary = atob(standard);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "Invalid base64 input" };
  }
}
