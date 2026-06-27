import { Settings } from "lucide-react";
import type { Tool } from "@/lib/tool";

const CATEGORY_LABELS: Record<Tool["category"], string> = {
  encoding: "Encoding",
  text: "Text",
  time: "Time",
  web: "Web",
  format: "Format",
};

interface TopbarProps {
  activeTool: Tool | undefined;
  activeToolId: string;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
}

export function Topbar({ activeTool, activeToolId, onOpenPalette, onOpenSettings }: TopbarProps) {
  const isSettings = activeToolId === "settings";
  const isHome = activeToolId === "home";

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2.5">
        {!isHome && !isSettings && activeTool && (
          <>
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-primary">
              <activeTool.icon className="h-3 w-3" />
            </div>
            <span className="text-sm font-semibold">{activeTool.name}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[activeTool.category]}
            </span>
          </>
        )}
        {isSettings && (
          <>
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-primary">
              <Settings className="h-3 w-3" />
            </div>
            <span className="text-sm font-semibold">Settings</span>
          </>
        )}
        {isHome && <span className="text-sm font-semibold text-muted-foreground">Dev Workbench</span>}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="font-mono">⌘K</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
