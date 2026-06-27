import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { csvToJson, jsonToCsv } from "./convert";

export function CsvJson() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"csv-to-json" | "json-to-csv">("csv-to-json");

  const result = useMemo(() => {
    if (input.trim() === "") return { ok: true as const, value: "" };
    return mode === "csv-to-json" ? csvToJson(input) : jsonToCsv(input);
  }, [input, mode]);

  return (
    <ToolShell
      title="CSV ↔ JSON"
      actions={
        <>
          <Button variant={mode === "csv-to-json" ? "default" : "outline"} size="sm" onClick={() => setMode("csv-to-json")}>
            CSV → JSON
          </Button>
          <Button variant={mode === "json-to-csv" ? "default" : "outline"} size="sm" onClick={() => setMode("json-to-csv")}>
            JSON → CSV
          </Button>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "csv-to-json" ? "Paste CSV here…" : "Paste JSON array here…"}
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
