import type { ReactNode } from "react";

interface ToolShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ToolShell({ actions, children }: ToolShellProps) {
  return (
    <div className="flex h-full flex-col">
      {actions && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
          {actions}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}

interface ToolPanesProps {
  children: ReactNode;
}

export function ToolPanes({ children }: ToolPanesProps) {
  return <div className="grid h-full grid-cols-2 gap-4">{children}</div>;
}
