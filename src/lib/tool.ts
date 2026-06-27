import type { LucideIcon } from "lucide-react";
import type { ComponentType, LazyExoticComponent } from "react";

export type ToolCategory = "encoding" | "text" | "time" | "web" | "format";

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  icon: LucideIcon;
  keywords: string[];
  component: ComponentType | LazyExoticComponent<any>;
}
