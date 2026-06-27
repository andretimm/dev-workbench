import { Clock } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const timestampConverter: Tool = {
  id: "timestamp",
  name: "Timestamp Converter",
  category: "time",
  icon: Clock,
  keywords: ["timestamp", "unix", "epoch", "date", "time"],
  component: lazy(() => import("./TimestampConverter").then(m => ({ default: m.TimestampConverter }))),
};
