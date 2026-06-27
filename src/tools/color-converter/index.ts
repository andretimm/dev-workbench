import { Palette } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const colorConverter: Tool = {
  id: "color-converter",
  name: "Color Converter",
  category: "web",
  icon: Palette,
  keywords: ["color", "hex", "rgb", "hsl"],
  component: lazy(() => import("./ColorConverter").then(m => ({ default: m.ColorConverter }))),
};
