import { AlignLeft } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const loremIpsum: Tool = {
  id: "lorem-ipsum",
  name: "Lorem Ipsum Generator",
  category: "text",
  icon: AlignLeft,
  keywords: ["lorem", "ipsum", "placeholder", "dummy text"],
  component: lazy(() => import("./LoremIpsum").then(m => ({ default: m.LoremIpsum }))),
};
