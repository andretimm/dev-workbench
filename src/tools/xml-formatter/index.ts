import { FileCode } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const xmlFormatter: Tool = {
  id: "xml-formatter",
  name: "XML Formatter",
  category: "format",
  icon: FileCode,
  keywords: ["xml", "format", "pretty", "minify", "indent", "html"],
  component: lazy(() => import("./XmlFormatter").then(m => ({ default: m.XmlFormatter }))),
};
