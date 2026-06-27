export type UrlResult = { ok: true; value: string } | { ok: false; error: string };

export function encodeUrl(input: string, component: boolean): UrlResult {
  try {
    return { ok: true, value: component ? encodeURIComponent(input) : encodeURI(input) };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function decodeUrl(input: string, component: boolean): UrlResult {
  try {
    return { ok: true, value: component ? decodeURIComponent(input) : decodeURI(input) };
  } catch {
    return { ok: false, error: "Invalid URL-encoded input" };
  }
}
