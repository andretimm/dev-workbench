import { GitCompare } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const textDiff: Tool = {
  id: "text-diff",
  name: "Text Diff",
  category: "text",
  icon: GitCompare,
  keywords: ["diff", "compare", "text", "changes"],
  component: lazy(() => import("./TextDiff").then(m => ({ default: m.TextDiff }))),
};
