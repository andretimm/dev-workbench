import { Braces } from "lucide-react";
import { toolsById } from "@/tools/registry";

const FEATURED = [
  "json-formatter",
  "jwt-decoder",
  "regex-tester",
  "color-converter",
  "timestamp",
];

interface HomeProps {
  onSelectTool: (id: string) => void;
}

export function Home({ onSelectTool }: HomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/30">
        <Braces className="h-10 w-10 text-primary-foreground" />
      </div>

      <div className="space-y-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Dev Workbench</h1>
        <p className="text-muted-foreground">Your dev toolbox, one shortcut away.</p>
      </div>

      <button
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
        }}
        className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-md shadow-primary/30 transition-opacity hover:opacity-90"
      >
        Press <kbd className="rounded bg-primary-foreground/20 px-1.5 py-0.5 font-mono text-xs">⌘K</kbd> to search tools
      </button>

      <div className="flex flex-wrap justify-center gap-2">
        {FEATURED.map((id) => {
          const tool = toolsById[id];
          if (!tool) return null;
          return (
            <button
              key={id}
              onClick={() => onSelectTool(id)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <tool.icon className="h-3.5 w-3.5 text-primary" />
              {tool.name}
            </button>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Works offline · nothing leaves your Mac
      </p>
    </div>
  );
}
