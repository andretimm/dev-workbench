import { Braces } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const stringEscape: Tool = {
  id: "string-escape",
  name: "String Escape",
  category: "encoding",
  icon: Braces,
  keywords: ["escape", "unescape", "string", "url", "html", "unicode", "json", "encode"],
  component: lazy(() => import("./StringEscape").then(m => ({ default: m.StringEscape }))),
};
