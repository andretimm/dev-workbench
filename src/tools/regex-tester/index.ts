import { Regex } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const regexTester: Tool = {
  id: "regex-tester",
  name: "Regex Tester",
  category: "text",
  icon: Regex,
  keywords: ["regex", "regexp", "pattern", "match"],
  component: lazy(() => import("./RegexTester").then(m => ({ default: m.RegexTester }))),
};
