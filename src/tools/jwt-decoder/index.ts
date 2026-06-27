import { KeyRound } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const jwtDecoder: Tool = {
  id: "jwt-decoder",
  name: "JWT Decoder",
  category: "web",
  icon: KeyRound,
  keywords: ["jwt", "token", "decode", "auth"],
  component: lazy(() => import("./JwtDecoder").then(m => ({ default: m.JwtDecoder }))),
};
