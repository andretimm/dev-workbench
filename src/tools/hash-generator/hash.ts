import { invoke } from "@tauri-apps/api/core";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function digestHex(algorithm: "SHA-1" | "SHA-256", input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return toHex(hashBuffer);
}

export function sha1Hex(input: string): Promise<string> {
  return digestHex("SHA-1", input);
}

export function sha256Hex(input: string): Promise<string> {
  return digestHex("SHA-256", input);
}

export function md5Hex(input: string): Promise<string> {
  return invoke<string>("md5_hash", { input });
}
