import { FileText } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const markdownPreview: Tool = {
  id: "markdown-preview",
  name: "Markdown Preview",
  category: "text",
  icon: FileText,
  keywords: ["markdown", "md", "preview", "render"],
  component: lazy(() => import("./MarkdownPreview").then(m => ({ default: m.MarkdownPreview }))),
};
