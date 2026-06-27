export type Unit = "auto" | "seconds" | "milliseconds";

export type ParseResult =
  | { ok: true; iso: string; local: string; utc: string; unitUsed: "seconds" | "milliseconds" }
  | { ok: false; error: string };

export type DateToTimestampResult =
  | { ok: true; seconds: number; milliseconds: number }
  | { ok: false; error: string };

export function parseTimestamp(input: string, unit: Unit = "auto"): ParseResult {
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: "Timestamp must be an integer (seconds or milliseconds)" };
  }

  const numeric = Number(trimmed);
  const resolvedUnit: "seconds" | "milliseconds" =
    unit === "auto" ? (Math.abs(numeric) >= 1e12 ? "milliseconds" : "seconds") : unit;

  const millis = resolvedUnit === "seconds" ? numeric * 1000 : numeric;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Resulting date is out of range" };
  }

  return {
    ok: true,
    iso: date.toISOString(),
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    unitUsed: resolvedUnit,
  };
}

export function dateToTimestamp(isoOrLocal: string): DateToTimestampResult {
  const date = new Date(isoOrLocal);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Could not parse that date" };
  }
  return { ok: true, seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime() };
}

export function nowTimestamp(): { seconds: number; milliseconds: number } {
  const ms = Date.now();
  return { seconds: Math.floor(ms / 1000), milliseconds: ms };
}
