import { Fingerprint } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const uuidGenerator: Tool = {
  id: "uuid-generator",
  name: "UUID Generator",
  category: "encoding",
  icon: Fingerprint,
  keywords: ["uuid", "guid", "v4", "id", "identifier"],
  component: lazy(() => import("./UuidGenerator").then(m => ({ default: m.UuidGenerator }))),
};
