import { Link } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const urlEncoder: Tool = {
  id: "url-encoder",
  name: "URL Encoder",
  category: "web",
  icon: Link,
  keywords: ["url", "uri", "encode", "decode", "percent", "querystring"],
  component: lazy(() => import("./UrlEncoder").then(m => ({ default: m.UrlEncoder }))),
};
