import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { generateUuids } from "./uuid";

export function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [ids, setIds] = useState<string[]>(() => generateUuids(5, false));

  function regenerate(nextCount = count, nextUppercase = uppercase) {
    setIds(generateUuids(nextCount, nextUppercase));
  }

  return (
    <ToolShell
      title="UUID Generator"
      actions={<CopyButton text={ids.join("\n")} label="Copy all" />}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Count
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => {
                const next = Number(e.target.value);
                setCount(next);
                regenerate(next, uppercase);
              }}
              className="w-16 rounded border bg-muted/30 px-2 py-1 text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={uppercase}
              onCheckedChange={(checked) => {
                const next = checked === true;
                setUppercase(next);
                regenerate(count, next);
              }}
            />
            Uppercase
          </label>
          <Button variant="outline" size="sm" onClick={() => regenerate()}>
            <RefreshCw className="h-4 w-4" />
            Generate
          </Button>
        </div>
        <div className="space-y-2 font-mono text-sm">
          {ids.map((id, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 truncate">{id}</span>
              <CopyButton text={id} />
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
