import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { parseTimestamp, dateToTimestamp, nowTimestamp, type Unit } from "./convert";

export function TimestampConverter() {
  const [tsInput, setTsInput] = useState("");
  const [unit, setUnit] = useState<Unit>("auto");
  const [dateInput, setDateInput] = useState("");

  const parsed = useMemo(() => (tsInput.trim() === "" ? null : parseTimestamp(tsInput, unit)), [tsInput, unit]);
  const reversed = useMemo(() => (dateInput.trim() === "" ? null : dateToTimestamp(dateInput)), [dateInput]);

  return (
    <ToolShell title="Timestamp Converter">
      <div className="flex h-full flex-col gap-6">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase text-muted-foreground">Timestamp → Date</h2>
            <Button size="sm" variant="outline" onClick={() => setTsInput(String(nowTimestamp().seconds))}>
              Now
            </Button>
            {(["auto", "seconds", "milliseconds"] as Unit[]).map((u) => (
              <Button key={u} size="sm" variant={unit === u ? "default" : "outline"} onClick={() => setUnit(u)}>
                {u}
              </Button>
            ))}
          </div>
          <input
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            placeholder="e.g. 1700000000 or 1700000000000"
            className="w-full rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
          />
          {parsed && !parsed.ok && <p className="mt-2 text-sm text-destructive">{parsed.error}</p>}
          {parsed && parsed.ok && (
            <div className="mt-3 space-y-1 font-mono text-sm">
              <div className="flex items-center gap-2">Local: {parsed.local} <CopyButton text={parsed.local} /></div>
              <div className="flex items-center gap-2">UTC: {parsed.utc} <CopyButton text={parsed.utc} /></div>
              <div className="flex items-center gap-2">ISO 8601: {parsed.iso} <CopyButton text={parsed.iso} /></div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Date → Timestamp</h2>
          <input
            type="datetime-local"
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
          />
          {reversed && !reversed.ok && <p className="mt-2 text-sm text-destructive">{reversed.error}</p>}
          {reversed && reversed.ok && (
            <div className="mt-3 space-y-1 font-mono text-sm">
              <div className="flex items-center gap-2">
                Seconds: {reversed.seconds} <CopyButton text={String(reversed.seconds)} />
              </div>
              <div className="flex items-center gap-2">
                Milliseconds: {reversed.milliseconds} <CopyButton text={String(reversed.milliseconds)} />
              </div>
            </div>
          )}
        </section>
      </div>
    </ToolShell>
  );
}
