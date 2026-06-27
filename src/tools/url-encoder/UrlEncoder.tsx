import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { decodeUrl, encodeUrl } from "./url";

export function UrlEncoder() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [component, setComponent] = useState(true);

  const result = useMemo(() => {
    if (input === "") return { ok: true as const, value: "" };
    return mode === "encode" ? encodeUrl(input, component) : decodeUrl(input, component);
  }, [input, mode, component]);

  return (
    <ToolShell
      title="URL Encoder"
      actions={
        <>
          <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>
            Encode
          </Button>
          <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>
            Decode
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={component} onCheckedChange={setComponent} />
            Component
          </label>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Text or URL to encode…" : "Percent-encoded text to decode…"}
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        {result.ok ? (
          <pre className="h-full overflow-auto whitespace-pre-wrap rounded border bg-muted/30 p-3 font-mono text-sm">
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
