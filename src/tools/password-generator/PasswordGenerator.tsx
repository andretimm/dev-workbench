import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { generatePassword, strengthLabel, DEFAULT_OPTIONS, type PasswordOptions } from "./generate";

const STRENGTH_COLOR = {
  "weak":       "bg-destructive",
  "fair":       "bg-yellow-500",
  "strong":     "bg-green-500",
  "very-strong": "bg-emerald-400",
};
const STRENGTH_LABEL = { "weak": "Weak", "fair": "Fair", "strong": "Strong", "very-strong": "Very strong" };
const STRENGTH_WIDTH = { "weak": "w-1/4", "fair": "w-2/4", "strong": "w-3/4", "very-strong": "w-full" };

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary" />
      {label}
    </label>
  );
}

export function PasswordGenerator() {
  const [opts, setOpts] = useState<PasswordOptions>(DEFAULT_OPTIONS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTIONS));

  const regenerate = useCallback(() => setPassword(generatePassword(opts)), [opts]);

  function update<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) {
    const next = { ...opts, [key]: value };
    setOpts(next);
    setPassword(generatePassword(next));
  }

  const strength = strengthLabel(password);

  return (
    <ToolShell
      title="Password Generator"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={regenerate}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <CopyButton text={password} />
        </>
      }
    >
      <div className="flex h-full flex-col gap-4 p-4">
        {/* Output */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="break-all font-mono text-base tracking-wider text-foreground">{password}</p>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{STRENGTH_LABEL[strength]}</span>
              <span>{password.length} chars</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div className={`h-full rounded-full transition-all ${STRENGTH_COLOR[strength]} ${STRENGTH_WIDTH[strength]}`} />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-card p-4">
          <label className="col-span-2 flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-muted-foreground">Length</span>
            <input
              type="range" min={8} max={128} value={opts.length}
              onChange={(e) => update("length", Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="w-8 text-right tabular-nums">{opts.length}</span>
          </label>

          <Toggle label="Uppercase (A–Z)" checked={opts.uppercase} onChange={(v) => update("uppercase", v)} />
          <Toggle label="Lowercase (a–z)" checked={opts.lowercase} onChange={(v) => update("lowercase", v)} />
          <Toggle label="Numbers (0–9)"   checked={opts.numbers}   onChange={(v) => update("numbers", v)} />
          <Toggle label="Symbols (!@#…)"  checked={opts.symbols}   onChange={(v) => update("symbols", v)} />
          <Toggle label="Exclude ambiguous (0,O,l,1,I)" checked={opts.excludeAmbiguous} onChange={(v) => update("excludeAmbiguous", v)} />
        </div>
      </div>
    </ToolShell>
  );
}
