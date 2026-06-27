import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { decodeJwt } from "./decode";

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;
  return new Date(value * 1000).toLocaleString();
}

export function JwtDecoder() {
  const [input, setInput] = useState("");

  const result = useMemo(() => (input.trim() === "" ? null : decodeJwt(input)), [input]);

  return (
    <ToolShell title="JWT Decoder">
      <div className="flex h-full flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a JWT…"
          className="h-24 w-full resize-none rounded border bg-muted/30 p-3 font-mono text-xs outline-none"
        />
        <p className="text-xs text-muted-foreground">
          Decoding only — signatures are not verified, no secret is required.
        </p>
        {result && !result.ok && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
            {result.error}
          </div>
        )}
        {result && result.ok && (
          <div className="grid flex-1 grid-cols-2 gap-4 overflow-auto">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Header</h2>
              <pre className="overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">
                {JSON.stringify(result.header, null, 2)}
              </pre>
            </div>
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                Payload
                {result.expired && (
                  <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-destructive">Expired</span>
                )}
                {!result.expired && "exp" in result.payload && (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-600">Valid</span>
                )}
              </h2>
              <pre className="overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {formatTimestamp(result.payload.iat) && <div>iat: {formatTimestamp(result.payload.iat)}</div>}
                {formatTimestamp(result.payload.nbf) && <div>nbf: {formatTimestamp(result.payload.nbf)}</div>}
                {formatTimestamp(result.payload.exp) && <div>exp: {formatTimestamp(result.payload.exp)}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
