import { Clock4 } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const cronParser: Tool = {
  id: "cron-parser",
  name: "Cron Parser",
  category: "time",
  icon: Clock4,
  keywords: ["cron", "crontab", "schedule", "next run"],
  component: lazy(() => import("./CronParser").then(m => ({ default: m.CronParser }))),
};
