const MAX_COUNT = 50;

export function generateUuids(count: number, uppercase: boolean): string[] {
  const n = Math.min(Math.max(Math.trunc(count), 1), MAX_COUNT);
  const ids = Array.from({ length: n }, () => crypto.randomUUID());
  return uppercase ? ids.map((id) => id.toUpperCase()) : ids;
}
