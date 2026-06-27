import { useState } from "react";
import { Braces, ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";
import { tools, type Tool } from "@/tools/registry";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<Tool["category"], string> = {
  encoding: "Encoding",
  text: "Text",
  time: "Time",
  web: "Web",
  format: "Format",
};

interface SidebarProps {
  activeToolId: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ activeToolId, onSelect }: SidebarProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const filtered =
    query.trim() === ""
      ? null
      : tools.filter(
          (t) =>
            t.name.toLowerCase().includes(query.toLowerCase()) ||
            t.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase())),
        );

  const byCategory = tools.reduce<Record<string, Tool[]>>((acc, tool) => {
    (acc[tool.category] ??= []).push(tool);
    return acc;
  }, {});

  return (
    <nav
      className={cn(
        "relative flex shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-12" : "w-48",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-11 shrink-0 items-center border-b border-border",
          collapsed ? "justify-center" : "gap-2.5 px-3",
        )}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Braces className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-bold tracking-tight">Dev Workbench</span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-2 py-2">
          <label className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools"
              className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </label>
        </div>
      )}

      {/* Tool list */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto py-1">
        {filtered !== null ? (
          <div className={collapsed ? "flex w-full flex-col items-center gap-0.5" : "px-1"}>
            {filtered.length === 0 ? (
              !collapsed && (
                <p className="px-2 py-2 text-xs text-muted-foreground">No tools found</p>
              )
            ) : (
              filtered.map((tool) => (
                <ToolItem
                  key={tool.id}
                  tool={tool}
                  active={activeToolId === tool.id}
                  collapsed={collapsed}
                  onClick={() => onSelect(tool.id)}
                />
              ))
            )}
          </div>
        ) : (
          Object.entries(byCategory).map(([category, items]) => (
            <div key={category} className="mb-1">
              {!collapsed && (
                <div className="px-3 pb-0.5 pt-2 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABELS[category as Tool["category"]]}
                </div>
              )}
              {collapsed && <div className="mx-auto mt-1 w-6 border-t border-border/40" />}
              <div className={collapsed ? "flex w-full flex-col items-center gap-0.5 py-0.5" : "px-1"}>
                {items.map((tool) => (
                  <ToolItem
                    key={tool.id}
                    tool={tool}
                    active={activeToolId === tool.id}
                    collapsed={collapsed}
                    onClick={() => onSelect(tool.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom: Settings + Collapse */}
      <div className={cn(
        "shrink-0 border-t border-border py-1",
        collapsed ? "flex flex-col items-center gap-0.5" : "px-1",
      )}>
        <BottomBtn
          icon={<Settings className="h-3.5 w-3.5" />}
          label="Settings"
          collapsed={collapsed}
          active={activeToolId === "settings"}
          onClick={() => onSelect("settings")}
        />
        <BottomBtn
          icon={collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          label="Collapse"
          collapsed={collapsed}
          onClick={() => setCollapsed((c) => !c)}
        />
      </div>
    </nav>
  );
}

/* ── ToolItem ───────────────────────────────────────────────────── */

interface ToolItemProps {
  tool: Tool;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function ToolItem({ tool, active, collapsed, onClick }: ToolItemProps) {
  return (
    <button
      onClick={onClick}
      title={tool.name}
      className={cn(
        "flex items-center rounded-md transition-colors",
        collapsed
          ? "h-8 w-8 justify-center"
          : "w-full gap-2 px-2 py-1.5 text-left text-xs",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/80 hover:bg-muted hover:text-foreground",
      )}
    >
      <tool.icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          active ? "text-primary-foreground" : "text-muted-foreground",
        )}
      />
      {!collapsed && <span className="truncate">{tool.name}</span>}
    </button>
  );
}

/* ── BottomBtn ──────────────────────────────────────────────────── */

interface BottomBtnProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}

function BottomBtn({ icon, label, collapsed, active, onClick }: BottomBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center rounded-md transition-colors",
        collapsed
          ? "h-8 w-8 justify-center"
          : "w-full gap-2 px-2 py-1.5 text-xs",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {!collapsed && label}
    </button>
  );
}
