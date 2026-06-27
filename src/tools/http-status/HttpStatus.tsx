import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { STATUSES, classOf } from "./statuses";

const CLASS_COLORS: Record<string, string> = {
  "1xx": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "2xx": "bg-green-500/15 text-green-400 border-green-500/30",
  "3xx": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "4xx": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "5xx": "bg-red-500/15 text-red-400 border-red-500/30",
};

export function HttpStatus() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATUSES;
    return STATUSES.filter(
      (s) =>
        String(s.code).includes(q) ||
        s.text.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <ToolShell title="HTTP Status Codes">
      <div className="flex h-full flex-col gap-2 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code, name, or description…"
          className="rounded border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
        />
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.map((s) => {
            const cls = classOf(s.code);
            return (
              <div key={s.code} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs font-semibold ${CLASS_COLORS[cls]}`}>
                  {s.code}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.text}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No status codes match "{query}"</p>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
