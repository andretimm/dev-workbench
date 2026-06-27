import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { md5Hex, sha1Hex, sha256Hex } from "./hash";

export function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState({ md5: "", sha1: "", sha256: "" });

  useEffect(() => {
    let cancelled = false;

    if (input === "") {
      Promise.resolve().then(() => {
        if (!cancelled) setHashes({ md5: "", sha1: "", sha256: "" });
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.all([md5Hex(input), sha1Hex(input), sha256Hex(input)]).then(([md5, sha1, sha256]) => {
      if (!cancelled) setHashes({ md5, sha1, sha256 });
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  return (
    <ToolShell title="Hash Generator">
      <div className="flex h-full flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Text to hash…"
          className="h-32 w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <div className="space-y-2 font-mono text-sm">
          {(["md5", "sha1", "sha256"] as const).map((algo) => (
            <div key={algo} className="flex items-center gap-2">
              <span className="w-16 shrink-0 uppercase text-muted-foreground">{algo}</span>
              <span className="flex-1 truncate">{hashes[algo]}</span>
              <CopyButton text={hashes[algo]} />
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
