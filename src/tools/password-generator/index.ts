import { KeySquare } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const passwordGenerator: Tool = {
  id: "password-generator",
  name: "Password Generator",
  category: "encoding",
  icon: KeySquare,
  keywords: ["password", "generate", "secret", "random", "secure", "strong"],
  component: lazy(() => import("./PasswordGenerator").then(m => ({ default: m.PasswordGenerator }))),
};
