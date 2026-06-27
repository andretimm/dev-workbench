import { Braces } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const jsonYaml: Tool = {
  id: "json-yaml",
  name: "JSON ↔ YAML",
  category: "format",
  icon: Braces,
  keywords: ["json", "yaml", "yml", "convert"],
  component: lazy(() => import("./JsonYaml").then(m => ({ default: m.JsonYaml }))),
};
