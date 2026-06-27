import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { jsonToYaml, yamlToJson } from "./convert";

export function JsonYaml() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"json-to-yaml" | "yaml-to-json">("json-to-yaml");

  const result = useMemo(() => {
    if (input.trim() === "") return { ok: true as const, value: "" };
    return mode === "json-to-yaml" ? jsonToYaml(input) : yamlToJson(input);
  }, [input, mode]);

  return (
    <ToolShell
      title="JSON ↔ YAML"
      actions={
        <>
          <Button
            variant={mode === "json-to-yaml" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("json-to-yaml")}
          >
            JSON → YAML
          </Button>
          <Button
            variant={mode === "yaml-to-json" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("yaml-to-json")}
          >
            YAML → JSON
          </Button>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "json-to-yaml" ? "JSON…" : "YAML…"}
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
