import { Hash } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const hashGenerator: Tool = {
  id: "hash-generator",
  name: "Hash Generator",
  category: "encoding",
  icon: Hash,
  keywords: ["hash", "md5", "sha1", "sha256", "checksum"],
  component: lazy(() => import("./HashGenerator").then(m => ({ default: m.HashGenerator }))),
};
