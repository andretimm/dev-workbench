import { Braces } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const jsonFormatter: Tool = {
  id: "json-formatter",
  name: "JSON Formatter",
  category: "format",
  icon: Braces,
  keywords: ["json", "format", "pretty", "minify", "validate"],
  component: lazy(() => import("./JsonFormatter").then(m => ({ default: m.JsonFormatter }))),
};
