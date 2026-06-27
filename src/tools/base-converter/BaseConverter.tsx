import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { convertAllBases, type Base } from "./base";

const BASES: { base: Base; label: string }[] = [
  { base: 2, label: "Binary" },
  { base: 8, label: "Octal" },
  { base: 10, label: "Decimal" },
  { base: 16, label: "Hex" },
];

export function BaseConverter() {
  const [input, setInput] = useState("");
  const [fromBase, setFromBase] = useState<Base>(10);

  const results = useMemo(() => convertAllBases(input, fromBase), [input, fromBase]);
  const invalid = input.trim() !== "" && results[fromBase] === "";

  return (
    <ToolShell title="Number Base Converter">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a number…"
            className="flex-1 rounded border bg-muted/30 px-3 py-2 font-mono text-sm outline-none"
          />
          <select
            value={fromBase}
            onChange={(e) => setFromBase(Number(e.target.value) as Base)}
            className="rounded border bg-muted/30 px-2 py-2 text-sm outline-none"
          >
            {BASES.map(({ base, label }) => (
              <option key={base} value={base}>
                From {label}
              </option>
            ))}
          </select>
        </div>
        {invalid && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            Invalid digits for the selected base
          </div>
        )}
        <div className="space-y-2 font-mono text-sm">
          {BASES.map(({ base, label }) => (
            <div key={base} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
              <span className="flex-1 truncate">{results[base]}</span>
              <CopyButton text={results[base]} />
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
