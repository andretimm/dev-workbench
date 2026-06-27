import { QrCode as QrCodeIcon } from "lucide-react";
import { lazy } from "react";
import type { Tool } from "@/lib/tool";

export const qrCode: Tool = {
  id: "qr-code",
  name: "QR Code Generator",
  category: "web",
  icon: QrCodeIcon,
  keywords: ["qr", "code", "barcode", "scan", "url", "generate"],
  component: lazy(() => import("./QrCode").then(m => ({ default: m.QrCode }))),
};
