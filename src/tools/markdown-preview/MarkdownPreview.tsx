import { useMemo, useState } from "react";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { renderMarkdown } from "./render";

const DEFAULT_INPUT = "# Hello\n\nSome **bold** and *italic* text.\n\n- one\n- two\n";

export function MarkdownPreview() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const html = useMemo(() => renderMarkdown(input), [input]);

  return (
    <ToolShell title="Markdown Preview">
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Markdown…"
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <div
          className="prose prose-sm h-full max-w-none overflow-auto rounded border bg-muted/30 p-3 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </ToolPanes>
    </ToolShell>
  );
}
