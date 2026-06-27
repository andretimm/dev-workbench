export type CronResult = { ok: true; description: string; nextRuns: Date[] } | { ok: false; error: string };

const FIELD_NAMES = ["minute", "hour", "day of month", "month", "day of week"] as const;
const FIELD_RANGES: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
];

function parseField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();
  for (const part of field.split(",")) {
    const stepMatch = part.match(/^(\*|\d+-\d+|\d+)\/(\d+)$/);
    const range = stepMatch ? stepMatch[1] : part;
    const step = stepMatch ? Number(stepMatch[2]) : 1;

    let lo = min;
    let hi = max;
    if (range !== "*") {
      const rangeMatch = range.match(/^(\d+)(?:-(\d+))?$/);
      if (!rangeMatch) throw new Error(`Invalid field segment "${part}"`);
      lo = Number(rangeMatch[1]);
      hi = rangeMatch[2] !== undefined ? Number(rangeMatch[2]) : lo;
    }
    if (lo < min || hi > max || lo > hi || step < 1) throw new Error(`Invalid field segment "${part}"`);

    for (let v = lo; v <= hi; v += step) values.add(v);
  }
  return values;
}

export function parseCron(expression: string): { fields: Set<number>[] } | { error: string } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { error: "Cron expression must have exactly 5 fields: minute hour day-of-month month day-of-week" };
  }

  try {
    const fields = parts.map((part, i) => parseField(part, FIELD_RANGES[i][0], FIELD_RANGES[i][1]));
    return { fields };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function describeField(field: string, name: string): string {
  if (field === "*") return `every ${name}`;
  if (/^\*\/\d+$/.test(field)) return `every ${field.split("/")[1]} ${name}s`;
  return `${name} ${field}`;
}

function describeCron(parts: string[]): string {
  return parts.map((part, i) => describeField(part, FIELD_NAMES[i])).join(", ");
}

export function evaluateCron(expression: string, count = 5, from = new Date()): CronResult {
  const parts = expression.trim().split(/\s+/);
  const parsed = parseCron(expression);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const [minutes, hours, daysOfMonth, months, daysOfWeek] = parsed.fields;
  const nextRuns: Date[] = [];
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const limit = new Date(from);
  limit.setFullYear(limit.getFullYear() + 4);

  while (nextRuns.length < count && cursor <= limit) {
    const matches =
      minutes.has(cursor.getMinutes()) &&
      hours.has(cursor.getHours()) &&
      daysOfMonth.has(cursor.getDate()) &&
      months.has(cursor.getMonth() + 1) &&
      daysOfWeek.has(cursor.getDay());

    if (matches) nextRuns.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  if (nextRuns.length < count) {
    return { ok: false, error: "No matching run found within 4 years — expression may be unsatisfiable" };
  }

  return { ok: true, description: describeCron(parts), nextRuns };
}
