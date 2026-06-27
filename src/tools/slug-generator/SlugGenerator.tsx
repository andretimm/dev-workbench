import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { toSlug } from "./slug";

export function SlugGenerator() {
  const [input, setInput] = useState("");
  const slug = useMemo(() => toSlug(input), [input]);

  return (
    <ToolShell title="Slug Generator" actions={<CopyButton text={slug} />}>
      <div className="flex h-full flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Title to slugify…"
          className="h-24 w-full resize-none rounded border bg-muted/30 p-3 text-sm outline-none"
        />
        <pre className="rounded border bg-muted/30 p-3 font-mono text-sm">{slug}</pre>
      </div>
    </ToolShell>
  );
}
