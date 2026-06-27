import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { diffDates } from "./logic";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function Row({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">
        {value.toLocaleString()} <span className="text-xs text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

export function DateDiff() {
  const [dateA, setDateA] = useState(today());
  const [dateB, setDateB] = useState(today());

  const result = useMemo(() => diffDates(dateA, dateB), [dateA, dateB]);

  return (
    <ToolShell title="Date Diff">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-3">
          {(["From", "To"] as const).map((label, i) => {
            const val = i === 0 ? dateA : dateB;
            const set = i === 0 ? setDateA : setDateB;
            return (
              <label key={label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <input
                  type="date"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="rounded border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
                />
              </label>
            );
          })}
        </div>

        {result ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {result.future ? "↑ future" : dateA === dateB ? "same day" : "↓ past"}
            </p>
            <Row label="Years"   value={result.years}   unit="yr"  />
            <Row label="Months"  value={result.months}  unit="mo"  />
            <Row label="Weeks"   value={result.weeks}   unit="wk"  />
            <Row label="Days"    value={result.days}    unit="d"   />
            <Row label="Hours"   value={result.hours}   unit="hr"  />
            <Row label="Minutes" value={result.minutes} unit="min" />
            <Row label="Seconds" value={result.seconds} unit="s"   />
          </div>
        ) : (
          <p className="text-sm text-destructive">Invalid date</p>
        )}
      </div>
    </ToolShell>
  );
}
