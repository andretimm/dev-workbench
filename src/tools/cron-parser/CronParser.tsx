import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { evaluateCron } from "./cron";

export function CronParser() {
  const [expression, setExpression] = useState("*/15 * * * *");

  const result = useMemo(() => evaluateCron(expression, 5), [expression]);

  return (
    <ToolShell title="Cron Parser">
      <div className="flex h-full flex-col gap-4">
        <input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="minute hour day-of-month month day-of-week"
          className="rounded border bg-muted/30 px-3 py-2 font-mono text-sm outline-none"
        />
        {result.ok ? (
          <>
            <p className="text-sm text-muted-foreground">{result.description}</p>
            <div className="space-y-1 font-mono text-sm">
              {result.nextRuns.map((run, i) => (
                <div key={i}>{run.toLocaleString()}</div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {result.error}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
