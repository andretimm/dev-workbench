import { CaseSensitive } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const caseConverter: Tool = {
  id: "case-converter",
  name: "Case Converter",
  category: "text",
  icon: CaseSensitive,
  keywords: ["case", "camelcase", "snake_case", "kebab-case", "pascalcase", "title case"],
  component: lazy(() => import("./CaseConverter").then(m => ({ default: m.CaseConverter }))),
};
