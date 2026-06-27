import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { findMatches } from "./match";

const FLAG_OPTIONS = ["g", "i", "m", "s", "u"] as const;

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [testString, setTestString] = useState("");

  const result = useMemo(
    () => (pattern === "" ? { ok: true as const, matches: [] } : findMatches(pattern, flags.join(""), testString)),
    [pattern, flags, testString],
  );

  function toggleFlag(flag: string) {
    setFlags((current) => (current.includes(flag) ? current.filter((f) => f !== flag) : [...current, flag]));
  }

  const highlighted = useMemo(() => {
    if (!result.ok || result.matches.length === 0) return testString;
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    result.matches.forEach((m, i) => {
      parts.push(testString.slice(cursor, m.index));
      parts.push(
        <mark key={i} className="rounded bg-yellow-300/60 px-0.5">
          {m.text}
        </mark>,
      );
      cursor = m.index + m.text.length;
    });
    parts.push(testString.slice(cursor));
    return parts;
  }, [result, testString]);

  return (
    <ToolShell title="Regex Tester">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            className="flex-1 rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
          />
          <span className="font-mono text-sm">/</span>
          {FLAG_OPTIONS.map((flag) => (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              className={`rounded px-2 py-1 font-mono text-xs ${flags.includes(flag) ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {flag}
            </button>
          ))}
        </div>
        {!result.ok && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {result.error}
          </div>
        )}
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Test string…"
          className="h-32 w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <div className="flex-1 overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap">
          {highlighted}
        </div>
        {result.ok && result.matches.length > 0 && (
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Capture groups (match 1 of {result.matches.length})
            </h2>
            <pre className="overflow-auto rounded border bg-muted/30 p-2 text-xs">
              {JSON.stringify({ groups: result.matches[0].groups, named: result.matches[0].namedGroups }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
