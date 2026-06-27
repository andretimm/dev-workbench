import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ToolShell } from "@/components/ToolShell";

const DEFAULT_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const ALL_ZONES: string[] = (Intl as { supportedValuesOf?: (key: string) => string[] })
  .supportedValuesOf?.("timeZone") ?? DEFAULT_ZONES;

function localNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatInZone(isoLocal: string, zone: string): string {
  const date = new Date(isoLocal);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function offsetLabel(isoLocal: string, zone: string): string {
  try {
    const date = new Date(isoLocal);
    if (isNaN(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch { return ""; }
}

export function TimeZone() {
  const [datetime, setDatetime] = useState(localNow);
  const [zones, setZones] = useState<string[]>(DEFAULT_ZONES);
  const [addInput, setAddInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleAddInput(val: string) {
    setAddInput(val);
    if (val.length < 2) { setSuggestions([]); return; }
    const q = val.toLowerCase();
    setSuggestions(ALL_ZONES.filter((z) => z.toLowerCase().includes(q) && !zones.includes(z)).slice(0, 6));
  }

  function addZone(z: string) {
    if (!zones.includes(z)) setZones((prev) => [...prev, z]);
    setAddInput("");
    setSuggestions([]);
  }

  function removeZone(z: string) {
    setZones((prev) => prev.filter((x) => x !== z));
  }

  const rows = useMemo(() => zones.map((z) => ({
    zone: z,
    formatted: formatInZone(datetime, z),
    offset: offsetLabel(datetime, z),
  })), [datetime, zones]);

  return (
    <ToolShell title="Time Zone Converter">
      <div className="flex h-full flex-col gap-3 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Date & Time</span>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="rounded border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
            />
          </label>

          <div className="relative flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Add timezone</span>
            <input
              value={addInput}
              onChange={(e) => handleAddInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && suggestions[0]) addZone(suggestions[0]); }}
              placeholder="e.g. Asia/Tokyo"
              className="rounded border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring w-52"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => addZone(s)}
                    className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted/60"
                  >{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {rows.map(({ zone, formatted, offset }) => (
            <div key={zone} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">{zone}</p>
                <p className="text-xs text-muted-foreground">{offset}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-foreground">{formatted}</span>
                <button
                  onClick={() => removeZone(zone)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${zone}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
