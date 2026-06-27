import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { analyzeText, formatReadingTime } from "./logic";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
      <span className="mt-0.5 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function WordCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyzeText(text), [text]);

  return (
    <ToolShell title="Word Counter">
      <div className="flex h-full flex-col gap-3 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text here…"
          className="min-h-0 flex-1 resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          <Stat label="Words"       value={stats.words.toLocaleString()} />
          <Stat label="Characters"  value={stats.chars.toLocaleString()} />
          <Stat label="No spaces"   value={stats.charsNoSpaces.toLocaleString()} />
          <Stat label="Lines"       value={stats.lines.toLocaleString()} />
          <Stat label="Sentences"   value={stats.sentences.toLocaleString()} />
          <Stat label="Paragraphs"  value={stats.paragraphs.toLocaleString()} />
          <Stat label="Read time"   value={formatReadingTime(stats.readingSeconds)} />
        </div>
      </div>
    </ToolShell>
  );
}
