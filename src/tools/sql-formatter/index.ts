import { Database } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const sqlFormatter: Tool = {
  id: "sql-formatter",
  name: "SQL Formatter",
  category: "format",
  icon: Database,
  keywords: ["sql", "format", "query", "postgresql", "mysql", "sqlite", "database"],
  component: lazy(() => import("./SqlFormatter").then(m => ({ default: m.SqlFormatter }))),
};
