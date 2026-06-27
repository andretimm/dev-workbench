import { CalendarDays } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const dateDiff: Tool = {
  id: "date-diff",
  name: "Date Diff",
  category: "time",
  icon: CalendarDays,
  keywords: ["date", "diff", "difference", "calendar", "days", "weeks", "months", "years"],
  component: lazy(() => import("./DateDiff").then(m => ({ default: m.DateDiff }))),
};
