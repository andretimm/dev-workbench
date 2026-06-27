import { useEffect, useState } from "react";
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import { getVersion } from "@tauri-apps/api/app";
import { RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  type Settings as SettingsType,
  type ThemeId,
} from "@/store/settings";
import {
  PRESETS,
  PRESETS_BY_ID,
  applyTokens,
  loadCustomTheme,
  saveCustomTheme,
  DEFAULT_CUSTOM_THEME,
  EDITABLE_TOKENS,
  type CustomTheme,
  type ThemeTokens,
} from "@/lib/themes";
import { cn } from "@/lib/utils";

const PRESET_META: Record<string, { bg: string; accent: string }> = {
  light:            { bg: "#f4f4fb", accent: "#6366f1" },
  dark:             { bg: "#0e0e1a", accent: "#6366f1" },
  dracula:          { bg: "#282a36", accent: "#bd93f9" },
  "atom-one-dark":  { bg: "#282c34", accent: "#528bff" },
};

interface SettingsProps {
  pendingUpdate: string | null;
  onCheckUpdate: () => Promise<string | null>;
  onInstallUpdate: () => Promise<void>;
  onDismissUpdate: () => void;
  onSaveSettings: (settings: SettingsType) => Promise<void>;
}

export function Settings({
  pendingUpdate,
  onCheckUpdate,
  onInstallUpdate,
  onDismissUpdate,
  onSaveSettings,
}: SettingsProps) {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [customTheme, setCustomTheme] = useState<CustomTheme>(DEFAULT_CUSTOM_THEME);
  const [saved, setSaved] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [checkStatus, setCheckStatus] = useState<"idle" | "checking" | "up-to-date" | "offline">("idle");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => {});
    loadSettings().then(async (loaded) => {
      setSettings(loaded);
      const autostartEnabled = await isAutostartEnabled();
      setSettings((s) => ({ ...s, launchAtLogin: autostartEnabled }));
      const custom = await loadCustomTheme();
      setCustomTheme(custom);
    });
  }, []);

  async function persistSettings(next: SettingsType) {
    setSettings(next);
    await onSaveSettings(next);
  }

  async function handleThemeSelect(theme: ThemeId) {
    await persistSettings({ ...settings, theme });
    if (theme === "custom") {
      applyTokens(customTheme.tokens, customTheme.isDark);
    } else {
      const preset = PRESETS_BY_ID[theme];
      applyTokens(preset.tokens, preset.isDark);
    }
  }

  async function handleLaunchAtLoginChange(enabled: boolean) {
    if (enabled) await enableAutostart();
    else await disableAutostart();
    await persistSettings({ ...settings, launchAtLogin: enabled });
  }

  async function handleCheckUpdatesOnStartupChange(enabled: boolean) {
    await persistSettings({ ...settings, checkUpdatesOnStartup: enabled });
  }

  async function handleCheckNow() {
    if (!navigator.onLine) {
      setCheckStatus("offline");
      setTimeout(() => setCheckStatus("idle"), 3000);
      return;
    }
    setCheckStatus("checking");
    const version = await onCheckUpdate();
    setCheckStatus(version ? "idle" : "up-to-date");
    if (!version) setTimeout(() => setCheckStatus("idle"), 3000);
  }

  async function handleInstall() {
    setInstalling(true);
    try {
      await onInstallUpdate();
    } catch {
      setInstalling(false);
    }
  }

  function handleTokenChange(key: keyof ThemeTokens, value: string) {
    const tokens = { ...customTheme.tokens, [key]: value };
    if (key === "primary") { tokens.accent = value; tokens.ring = value; }
    if (key === "primaryForeground") tokens.accentForeground = value;
    if (key === "foreground") {
      tokens.cardForeground = value;
      tokens.popoverForeground = value;
      tokens.secondaryForeground = value;
      tokens.sidebarForeground = value;
    }
    if (key === "card")   tokens.popover   = value;
    if (key === "muted")  tokens.secondary = value;
    if (key === "border") { tokens.input = value; tokens.sidebarBorder = value; }
    const next = { ...customTheme, tokens };
    setCustomTheme(next);
    if (settings.theme === "custom") applyTokens(next.tokens, next.isDark);
  }

  function handleIsDarkChange(isDark: boolean) {
    const next = { ...customTheme, isDark };
    setCustomTheme(next);
    if (settings.theme === "custom") applyTokens(next.tokens, isDark);
  }

  async function handleSaveCustom() {
    await saveCustomTheme(customTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-lg space-y-8 px-6 py-8">

        <section>
          <h2 className="mb-3 text-base font-semibold">Theme</h2>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const meta = PRESET_META[preset.id];
              return (
                <ThemeCard
                  key={preset.id}
                  label={preset.name}
                  active={settings.theme === preset.id}
                  swatches={meta ? [meta.bg, meta.accent] : []}
                  onClick={() => handleThemeSelect(preset.id as ThemeId)}
                />
              );
            })}
            <ThemeCard
              label="Custom"
              active={settings.theme === "custom"}
              swatches={["#ef4444", "#22c55e", "#3b82f6", "#f59e0b"]}
              onClick={() => handleThemeSelect("custom")}
            />
          </div>
        </section>

        {settings.theme === "custom" && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Custom theme</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
                <Switch checked={customTheme.isDark} onCheckedChange={handleIsDarkChange} />
                Dark variant
              </label>
            </div>
            <div className="space-y-1.5">
              {EDITABLE_TOKENS.map(({ key, label }) => (
                <TokenRow
                  key={key}
                  label={label}
                  value={customTheme.tokens[key]}
                  onChange={(v) => handleTokenChange(key, v)}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSaveCustom}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Save theme
              </button>
              {saved && <span className="text-xs text-muted-foreground">Saved ✓</span>}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium">Launch at login</p>
              <p className="text-xs text-muted-foreground">
                Start Dev Workbench automatically when you log in.
              </p>
            </div>
            <Switch checked={settings.launchAtLogin} onCheckedChange={handleLaunchAtLoginChange} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Updates</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium">Check for updates on startup</p>
                <p className="text-xs text-muted-foreground">
                  Notify when a new version is available.
                </p>
              </div>
              <Switch
                checked={settings.checkUpdatesOnStartup}
                onCheckedChange={handleCheckUpdatesOnStartupChange}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              {pendingUpdate ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">v{pendingUpdate} available</p>
                    <p className="text-xs text-muted-foreground">
                      A new version is ready to install.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onDismissUpdate}
                      disabled={installing}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleInstall}
                      disabled={installing}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {installing ? "Installing…" : "Install & restart"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {checkStatus === "up-to-date" ? "Up to date" : "Check for updates"}
                    </p>
                    {appVersion && (
                      <p className="text-xs text-muted-foreground">Current version: v{appVersion}</p>
                    )}
                  </div>
                  <button
                    onClick={handleCheckNow}
                    disabled={checkStatus === "checking"}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", checkStatus === "checking" && "animate-spin")} />
                    {checkStatus === "checking"   ? "Checking…"
                     : checkStatus === "up-to-date" ? "Already up to date"
                     : checkStatus === "offline"    ? "No internet connection"
                     : "Check now"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

interface ThemeCardProps {
  label: string;
  active: boolean;
  swatches: string[];
  onClick: () => void;
}

function ThemeCard({ label, active, swatches, onClick }: ThemeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-all",
        active
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="mb-2 flex gap-1.5">
        {swatches.map((color, i) => (
          <span key={i} className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
        ))}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

interface TokenRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function TokenRow({ label, value, onChange }: TokenRowProps) {
  const hexValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#888888";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border">
        <span className="absolute inset-0" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none"
        placeholder="#000000"
      />
    </div>
  );
}
