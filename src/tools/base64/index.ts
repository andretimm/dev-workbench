import { Binary } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const base64Tool: Tool = {
  id: "base64",
  name: "Base64",
  category: "encoding",
  icon: Binary,
  keywords: ["base64", "encode", "decode"],
  component: lazy(() => import("./Base64Tool").then(m => ({ default: m.Base64Tool }))),
};
