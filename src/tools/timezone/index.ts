import { Globe2 } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const timeZone: Tool = {
  id: "timezone",
  name: "Time Zone Converter",
  category: "time",
  icon: Globe2,
  keywords: ["timezone", "time", "zone", "utc", "convert", "gmt", "dst"],
  component: lazy(() => import("./TimeZone").then(m => ({ default: m.TimeZone }))),
};
