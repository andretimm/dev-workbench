import { FileText } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const wordCounter: Tool = {
  id: "word-counter",
  name: "Word Counter",
  category: "text",
  icon: FileText,
  keywords: ["word", "count", "character", "char", "lines", "reading", "time"],
  component: lazy(() => import("./WordCounter").then(m => ({ default: m.WordCounter }))),
};
