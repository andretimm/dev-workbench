export interface DateDiffResult {
  days: number;
  weeks: number;
  months: number;
  years: number;
  hours: number;
  minutes: number;
  seconds: number;
  future: boolean;
}

export function diffDates(a: string, b: string): DateDiffResult | null {
  const dateA = new Date(a);
  const dateB = new Date(b);
  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return null;

  const from = dateA < dateB ? dateA : dateB;
  const to = dateA < dateB ? dateB : dateA;
  const future = dateB > dateA;

  const totalMs = to.getTime() - from.getTime();
  const seconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalMs / 60_000);
  const hours = Math.floor(totalMs / 3_600_000);
  const days = Math.floor(totalMs / 86_400_000);
  const weeks = Math.floor(days / 7);

  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months--;

  const years = Math.floor(months / 12);

  return { days, weeks, months, years, hours, minutes, seconds, future };
}
