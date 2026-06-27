import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import {
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  toTitleCase,
} from "./cases";

const CASES = [
  { label: "camelCase", fn: toCamelCase },
  { label: "PascalCase", fn: toPascalCase },
  { label: "snake_case", fn: toSnakeCase },
  { label: "kebab-case", fn: toKebabCase },
  { label: "CONSTANT_CASE", fn: toConstantCase },
  { label: "Title Case", fn: toTitleCase },
] as const;

export function CaseConverter() {
  const [input, setInput] = useState("");

  const results = useMemo(() => {
    if (input.trim() === "") return CASES.map((c) => ({ label: c.label, value: "" }));
    return CASES.map((c) => ({ label: c.label, value: c.fn(input) }));
  }, [input]);

  return (
    <ToolShell title="Case Converter">
      <div className="flex h-full flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="hello world, hello-world, hello_world, helloWorld…"
          className="h-24 w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <div className="space-y-2 font-mono text-sm">
          {results.map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
              <span className="flex-1 truncate">{value}</span>
              <CopyButton text={value} />
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
