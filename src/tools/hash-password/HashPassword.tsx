import { useCallback, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";

type Algorithm = "bcrypt" | "argon2id";
type Mode = "hash" | "verify";

async function hashBcrypt(password: string, rounds: number): Promise<string> {
  const { hash } = await import("bcryptjs");
  return hash(password, rounds);
}

async function verifyBcrypt(password: string, stored: string): Promise<boolean> {
  const { compare } = await import("bcryptjs");
  return compare(password, stored);
}

async function hashArgon2(password: string): Promise<string> {
  const { argon2id } = await import("hash-wasm");
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return argon2id({ password, salt, parallelism: 1, iterations: 3, memorySize: 65536, hashLength: 32, outputType: "encoded" });
}

async function verifyArgon2(password: string, stored: string): Promise<boolean> {
  const { argon2Verify } = await import("hash-wasm");
  return argon2Verify({ password, hash: stored });
}

export function HashPassword() {
  const [mode, setMode] = useState<Mode>("hash");
  const [algo, setAlgo] = useState<Algorithm>("bcrypt");
  const [bcryptRounds, setBcryptRounds] = useState(10);
  const [password, setPassword] = useState("");
  const [storedHash, setStoredHash] = useState("");
  const [output, setOutput] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    setOutput("");
    setVerifyResult(null);
    try {
      if (mode === "hash") {
        const h = algo === "bcrypt"
          ? await hashBcrypt(password, bcryptRounds)
          : await hashArgon2(password);
        setOutput(h);
      } else {
        const ok = algo === "bcrypt"
          ? await verifyBcrypt(password, storedHash)
          : await verifyArgon2(password, storedHash);
        setVerifyResult(ok);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [mode, algo, password, storedHash, bcryptRounds]);

  return (
    <ToolShell
      title="Password Hashing"
      actions={<>{output && <CopyButton text={output} />}</>}
    >
      <div className="flex h-full flex-col gap-4 p-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex gap-1.5">
            {(["hash", "verify"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >{m}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(["bcrypt", "argon2id"] as Algorithm[]).map((a) => (
              <button
                key={a}
                onClick={() => setAlgo(a)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  algo === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >{a}</button>
            ))}
          </div>
          {algo === "bcrypt" && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Rounds
              <input
                type="number" min={4} max={14} value={bcryptRounds}
                onChange={(e) => setBcryptRounds(Number(e.target.value))}
                className="w-14 rounded border border-border bg-muted/40 px-2 py-0.5 text-center text-foreground outline-none"
              />
            </label>
          )}
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Password</span>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") run(); }}
              placeholder="Enter password…"
              className="rounded border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-ring"
            />
          </label>

          {mode === "verify" && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Stored hash</span>
              <input
                type="text"
                value={storedHash}
                onChange={(e) => setStoredHash(e.target.value)}
                placeholder="$2b$10$… or $argon2id$…"
                className="rounded border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-ring"
              />
            </label>
          )}
        </div>

        <button
          onClick={run}
          disabled={loading || !password}
          className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? "Processing…" : mode === "hash" ? "Generate Hash" : "Verify"}
        </button>

        {/* Output */}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {output && (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="break-all font-mono text-sm text-foreground">{output}</p>
          </div>
        )}
        {verifyResult !== null && (
          <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
            verifyResult
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {verifyResult ? "✓ Password matches" : "✗ Password does not match"}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
