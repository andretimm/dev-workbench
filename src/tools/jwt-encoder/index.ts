import { FileCode } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const jwtEncoder: Tool = {
  id: "jwt-encoder",
  name: "JWT Encoder",
  category: "web",
  icon: FileCode,
  keywords: ["jwt", "json web token", "hs256", "sign", "encode"],
  component: lazy(() => import("./JwtEncoder").then(m => ({ default: m.JwtEncoder }))),
};
