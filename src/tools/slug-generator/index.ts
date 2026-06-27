import { Link2 } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const slugGenerator: Tool = {
  id: "slug-generator",
  name: "Slug Generator",
  category: "text",
  icon: Link2,
  keywords: ["slug", "url", "kebab", "permalink"],
  component: lazy(() => import("./SlugGenerator").then(m => ({ default: m.SlugGenerator }))),
};
