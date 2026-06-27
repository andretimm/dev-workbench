import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { tools, type Tool } from "@/tools/registry";
import { fuzzyScore } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<Tool["category"], string> = {
  encoding: "Encoding",
  text: "Text",
  time: "Time",
  web: "Web",
  format: "Format",
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (toolId: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  if (!open) return null;
  return <CommandPaletteContent onClose={onClose} onSelect={onSelect} />;
}

interface CommandPaletteContentProps {
  onClose: () => void;
  onSelect: (toolId: string) => void;
}

function CommandPaletteContent({ onClose, onSelect }: CommandPaletteContentProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const results = useMemo(() => {
    if (query.trim() === "") return tools;
    return tools
      .map((tool) => {
        const haystacks = [tool.name, ...tool.keywords];
        const best = Math.max(...haystacks.map((h) => fuzzyScore(query, h)));
        return { tool, score: best };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.tool);
  }, [query]);

  const clampedIndex = results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const tool = results[clampedIndex];
      if (tool) {
        onSelect(tool.id);
        onClose();
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools and actions…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
            esc
          </kbd>
        </div>

        {/* Results */}
        <ul className="max-h-80 overflow-y-auto py-1.5">
          {results.map((tool, i) => (
            <li key={tool.id} className="px-1.5">
              <button
                onClick={() => {
                  onSelect(tool.id);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === clampedIndex
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded",
                    i === clampedIndex ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                  )}
                >
                  <tool.icon className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1 font-medium">{tool.name}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider",
                    i === clampedIndex
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {CATEGORY_LABELS[tool.category]}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No tools match.
            </li>
          )}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted/50 px-1 font-mono text-[0.6rem]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted/50 px-1 font-mono text-[0.6rem]">↵</kbd>
              open
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{results.length} tools</span>
        </div>
      </div>
    </div>
  );
}
