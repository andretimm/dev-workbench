import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { parseColor } from "./convert";

export function ColorConverter() {
  const [input, setInput] = useState("#3b82f6");

  const result = useMemo(() => parseColor(input), [input]);

  return (
    <ToolShell title="Color Converter">
      <div className="flex h-full flex-col gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="#rrggbb, rgb(r, g, b), or hsl(h, s%, l%)"
          className="w-full rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
        />
        {!result.ok && <p className="text-sm text-destructive">{result.error}</p>}
        {result.ok && (
          <div className="flex items-center gap-6">
            <div
              className="h-24 w-24 rounded border"
              style={{ backgroundColor: result.hex }}
              aria-label="color preview"
            />
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-2">{result.hex} <CopyButton text={result.hex} /></div>
              <div className="flex items-center gap-2">{result.rgb} <CopyButton text={result.rgb} /></div>
              <div className="flex items-center gap-2">{result.hsl} <CopyButton text={result.hsl} /></div>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
