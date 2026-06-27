import { Binary } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const baseConverter: Tool = {
  id: "base-converter",
  name: "Number Base Converter",
  category: "format",
  icon: Binary,
  keywords: ["binary", "octal", "decimal", "hex", "hexadecimal", "base"],
  component: lazy(() => import("./BaseConverter").then(m => ({ default: m.BaseConverter }))),
};
