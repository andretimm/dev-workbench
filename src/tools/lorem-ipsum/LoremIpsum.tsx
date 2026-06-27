import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { generateParagraphs, generateSentences, generateWords } from "./lorem";

type Unit = "words" | "sentences" | "paragraphs";

function generate(unit: Unit, count: number): string {
  if (unit === "words") return generateWords(count);
  if (unit === "sentences") return generateSentences(count);
  return generateParagraphs(count).join("\n\n");
}

export function LoremIpsum() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState(() => generate("paragraphs", 3));

  function regenerate(nextUnit = unit, nextCount = count) {
    setOutput(generate(nextUnit, nextCount));
  }

  return (
    <ToolShell title="Lorem Ipsum Generator" actions={<CopyButton text={output} />}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => {
              const next = Number(e.target.value);
              setCount(next);
              regenerate(unit, next);
            }}
            className="w-16 rounded border bg-muted/30 px-2 py-1 text-sm outline-none"
          />
          <select
            value={unit}
            onChange={(e) => {
              const next = e.target.value as Unit;
              setUnit(next);
              regenerate(next, count);
            }}
            className="rounded border bg-muted/30 px-2 py-1 text-sm outline-none"
          >
            <option value="words">Words</option>
            <option value="sentences">Sentences</option>
            <option value="paragraphs">Paragraphs</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => regenerate()}>
            <RefreshCw className="h-4 w-4" />
            Generate
          </Button>
        </div>
        <pre className="flex-1 overflow-auto whitespace-pre-wrap rounded border bg-muted/30 p-3 text-sm">
          {output}
        </pre>
      </div>
    </ToolShell>
  );
}
