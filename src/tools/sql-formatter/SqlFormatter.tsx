import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { formatSql, DIALECTS, type Dialect } from "./format";

export function SqlFormatter() {
  const [input, setInput] = useState("");
  const [dialect, setDialect] = useState<Dialect>("sql");

  const result = useMemo(() => formatSql(input, dialect), [input, dialect]);

  return (
    <ToolShell
      title="SQL Formatter"
      actions={
        <>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as Dialect)}
            className="rounded border border-border bg-muted/40 px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste SQL here…"
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        {result.ok ? (
          <pre className="h-full overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap">
            {result.value}
          </pre>
        ) : (
          <div className="h-full overflow-auto rounded border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
            {result.error}
          </div>
        )}
      </ToolPanes>
    </ToolShell>
  );
}
