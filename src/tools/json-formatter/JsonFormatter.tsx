import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { formatJson, minifyJson } from "./format";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");

  const result = useMemo(() => {
    if (input.trim() === "") return { ok: true as const, value: "" };
    return mode === "format" ? formatJson(input) : minifyJson(input);
  }, [input, mode]);

  return (
    <ToolShell
      title="JSON Formatter"
      actions={
        <>
          <Button variant={mode === "format" ? "default" : "outline"} size="sm" onClick={() => setMode("format")}>
            Format
          </Button>
          <Button variant={mode === "minify" ? "default" : "outline"} size="sm" onClick={() => setMode("minify")}>
            Minify
          </Button>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste JSON here…"
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        {result.ok ? (
          <pre className="h-full overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">{result.value}</pre>
        ) : (
          <div className="h-full overflow-auto rounded border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
            {result.error}
          </div>
        )}
      </ToolPanes>
    </ToolShell>
  );
}
