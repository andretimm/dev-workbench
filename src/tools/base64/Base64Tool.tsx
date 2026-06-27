import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { encodeBase64, decodeBase64 } from "./base64";

export function Base64Tool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);

  const result = useMemo(() => {
    if (input === "") return { ok: true as const, value: "" };
    return mode === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input, urlSafe);
  }, [input, mode, urlSafe]);

  return (
    <ToolShell
      title="Base64"
      actions={
        <>
          <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>
            Encode
          </Button>
          <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>
            Decode
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={urlSafe} onCheckedChange={setUrlSafe} />
            URL-safe
          </label>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Text to encode…" : "Base64 to decode…"}
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
