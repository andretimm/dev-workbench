import { Globe } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const httpStatus: Tool = {
  id: "http-status",
  name: "HTTP Status Codes",
  category: "web",
  icon: Globe,
  keywords: ["http", "status", "code", "404", "500", "200", "rest", "api"],
  component: lazy(() => import("./HttpStatus").then(m => ({ default: m.HttpStatus }))),
};
