import { Table } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const csvJson: Tool = {
  id: "csv-json",
  name: "CSV ↔ JSON",
  category: "format",
  icon: Table,
  keywords: ["csv", "json", "convert", "table", "spreadsheet", "import", "export"],
  component: lazy(() => import("./CsvJson").then(m => ({ default: m.CsvJson }))),
};
