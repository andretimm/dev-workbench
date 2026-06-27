import { Terminal } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const curlFetch: Tool = {
  id: "curl-fetch",
  name: "cURL ↔ Fetch",
  category: "web",
  icon: Terminal,
  keywords: ["curl", "fetch", "http", "request", "convert", "api"],
  component: lazy(() => import("./CurlFetch").then(m => ({ default: m.CurlFetch }))),
};
