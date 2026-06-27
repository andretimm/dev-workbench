import { Code2 } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const htmlEntities: Tool = {
  id: "html-entities",
  name: "HTML Entities",
  category: "encoding",
  icon: Code2,
  keywords: ["html", "entity", "entities", "escape", "unescape"],
  component: lazy(() => import("./HtmlEntities").then(m => ({ default: m.HtmlEntities }))),
};
