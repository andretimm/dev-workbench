import { useMemo, useState } from "react";
import { diffLines } from "diff";
import { Switch } from "@/components/ui/switch";
import { ToolShell } from "@/components/ToolShell";

function splitChunkLines(value: string): string[] {
  const lines = value.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

export function TextDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const changes = useMemo(
    () => diffLines(left, right, { ignoreWhitespace }),
    [left, right, ignoreWhitespace],
  );

  return (
    <ToolShell
      title="Text Diff"
      actions={
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={ignoreWhitespace} onCheckedChange={setIgnoreWhitespace} />
          Ignore whitespace
        </label>
      }
    >
      <div className="flex h-full flex-col gap-4">
        <div className="grid h-40 grid-cols-2 gap-4">
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Original text…"
            className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
          />
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Changed text…"
            className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
          />
        </div>
        <div className="flex-1 overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">
          {changes.map((part, i) => (
            <div
              key={i}
              className={
                part.added
                  ? "bg-emerald-500/20 text-emerald-700"
                  : part.removed
                    ? "bg-red-500/20 text-red-700"
                    : ""
              }
            >
              {splitChunkLines(part.value).map((line, j) => (
                <div key={j}>
                  {part.added ? "+ " : part.removed ? "- " : "  "}
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
