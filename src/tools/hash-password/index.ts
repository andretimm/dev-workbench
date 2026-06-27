import { ShieldCheck } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const hashPassword: Tool = {
  id: "hash-password",
  name: "Password Hashing",
  category: "encoding",
  icon: ShieldCheck,
  keywords: ["bcrypt", "argon2", "hash", "password", "crypto", "verify"],
  component: lazy(() => import("./HashPassword").then(m => ({ default: m.HashPassword }))),
};
