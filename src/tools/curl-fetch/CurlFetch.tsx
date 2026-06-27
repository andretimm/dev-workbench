import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { curlToFetch, fetchToCurl } from "./parse";

export function CurlFetch() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"curl-to-fetch" | "fetch-to-curl">("curl-to-fetch");

  const result = useMemo(() => {
    if (input.trim() === "") return { ok: true as const, value: "" };
    return mode === "curl-to-fetch" ? curlToFetch(input) : fetchToCurl(input);
  }, [input, mode]);

  return (
    <ToolShell
      title="cURL ↔ Fetch"
      actions={
        <>
          <Button variant={mode === "curl-to-fetch" ? "default" : "outline"} size="sm" onClick={() => setMode("curl-to-fetch")}>
            curl → fetch
          </Button>
          <Button variant={mode === "fetch-to-curl" ? "default" : "outline"} size="sm" onClick={() => setMode("fetch-to-curl")}>
            fetch → curl
          </Button>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "curl-to-fetch"
            ? "curl https://api.example.com \\\n  -H 'Authorization: Bearer TOKEN' \\\n  -d '{\"key\":\"value\"}'"
            : "fetch(\"https://api.example.com\", { method: \"POST\", ... })"}
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
