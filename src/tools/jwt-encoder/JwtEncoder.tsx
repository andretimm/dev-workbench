import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { encodeJwtHS256 } from "./encode";

const DEFAULT_PAYLOAD = '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}';

export function JwtEncoder() {
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [result, setResult] = useState<{ ok: true; token: string } | { ok: false; error: string }>({
    ok: true,
    token: "",
  });

  useEffect(() => {
    let cancelled = false;
    encodeJwtHS256(payload, secret).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [payload, secret]);

  return (
    <ToolShell
      title="JWT Encoder"
      actions={<CopyButton text={result.ok ? result.token : ""} />}
    >
      <div className="flex h-full flex-col gap-4">
        <label className="flex items-center gap-2 text-sm">
          Secret (HS256)
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="flex-1 rounded border bg-muted/30 px-2 py-1 font-mono text-sm outline-none"
          />
        </label>
        <ToolPanes>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Payload JSON…"
            className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
          />
          {result.ok ? (
            <pre className="h-full overflow-auto whitespace-pre-wrap break-all rounded border bg-muted/30 p-3 font-mono text-sm">
              {result.token}
            </pre>
          ) : (
            <div className="h-full overflow-auto rounded border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
              {result.error}
            </div>
          )}
        </ToolPanes>
      </div>
    </ToolShell>
  );
}
