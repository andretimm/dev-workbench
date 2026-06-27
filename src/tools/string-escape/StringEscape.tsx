import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { escapeStr, unescapeStr, MODES, type EscapeMode } from "./escape";

export function StringEscape() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<EscapeMode>("js");
  const [direction, setDirection] = useState<"escape" | "unescape">("escape");

  const output = useMemo(() => {
    if (input === "") return "";
    try {
      return direction === "escape" ? escapeStr(input, mode) : unescapeStr(input, mode);
    } catch {
      return input;
    }
  }, [input, mode, direction]);

  return (
    <ToolShell
      title="String Escape"
      actions={
        <>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as EscapeMode)}
            className="rounded border border-border bg-muted/40 px-2 py-1 text-xs text-foreground outline-none"
          >
            {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <Button variant={direction === "escape" ? "default" : "outline"} size="sm" onClick={() => setDirection("escape")}>Escape</Button>
          <Button variant={direction === "unescape" ? "default" : "outline"} size="sm" onClick={() => setDirection("unescape")}>Unescape</Button>
          <CopyButton text={output} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Input…"
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <pre className="h-full overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap">
          {output}
        </pre>
      </ToolPanes>
    </ToolShell>
  );
}
