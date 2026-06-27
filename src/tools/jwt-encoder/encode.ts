export type JwtEncodeResult = { ok: true; token: string } | { ok: false; error: string };

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlFromString(str: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(str));
}

export async function encodeJwtHS256(payloadJson: string, secret: string): Promise<JwtEncodeResult> {
  let payloadObj: unknown;
  try {
    payloadObj = JSON.parse(payloadJson);
  } catch {
    return { ok: false, error: "Payload must be valid JSON" };
  }
  if (secret === "") return { ok: false, error: "Secret is required" };

  const headerSeg = base64UrlFromString(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadSeg = base64UrlFromString(JSON.stringify(payloadObj));
  const signingInput = `${headerSeg}.${payloadSeg}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const sigSeg = base64UrlFromBytes(new Uint8Array(signature));

  return { ok: true, token: `${signingInput}.${sigSeg}` };
}
