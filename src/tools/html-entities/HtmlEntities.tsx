import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { decodeHtmlEntities, encodeHtmlEntities } from "./entities";

export function HtmlEntities() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const output = useMemo(
    () => (mode === "encode" ? encodeHtmlEntities(input) : decodeHtmlEntities(input)),
    [input, mode],
  );

  return (
    <ToolShell
      title="HTML Entities"
      actions={
        <>
          <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>
            Encode
          </Button>
          <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>
            Decode
          </Button>
          <CopyButton text={output} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "HTML to escape…" : "Entities to decode…"}
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <pre className="h-full overflow-auto whitespace-pre-wrap rounded border bg-muted/30 p-3 font-mono text-sm">
          {output}
        </pre>
      </ToolPanes>
    </ToolShell>
  );
}
