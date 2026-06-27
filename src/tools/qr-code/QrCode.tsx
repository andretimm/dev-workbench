import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolShell } from "@/components/ToolShell";

const SIZES = [128, 256, 512] as const;
type Size = (typeof SIZES)[number];

export function QrCode() {
  const [text, setText] = useState("");
  const [size, setSize] = useState<Size>(256);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (text.trim() === "") { setDataUrl(""); setError(""); return; }

    debounce.current = setTimeout(async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          width: size,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setDataUrl(url);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      }
    }, 200);

    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [text, size]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr-code.png";
    a.click();
  }

  return (
    <ToolShell
      title="QR Code Generator"
      actions={
        <>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value) as Size)}
            className="rounded border border-border bg-muted/40 px-2 py-1 text-xs text-foreground outline-none"
          >
            {SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={download} disabled={!dataUrl}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter URL or text to encode…"
          className="rounded border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
        />
        <div className="flex flex-1 items-center justify-center">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && dataUrl && (
            <img
              src={dataUrl}
              alt="QR Code"
              className="rounded-lg shadow"
              style={{ width: size, height: size, maxWidth: "100%", maxHeight: "100%" }}
            />
          )}
          {!error && !dataUrl && (
            <p className="text-sm text-muted-foreground">Type something above to generate a QR code</p>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
