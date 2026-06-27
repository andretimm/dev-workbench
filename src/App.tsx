import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Download, X } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Home } from "@/components/Home";
import { CommandPalette } from "@/components/CommandPalette";
import { Settings } from "@/components/Settings";
import { toolsById } from "@/tools/registry";
import { getLastToolId, setLastToolId } from "@/lib/lastTool";
import { loadSettings, saveSettings, DEFAULT_SHORTCUT } from "@/store/settings";
import { applyTokens, PRESETS_BY_ID, DARK_PRESET, loadCustomTheme } from "@/lib/themes";
import "./App.css";

function UpdateBanner({
  version,
  installing,
  onInstall,
  onDismiss,
}: {
  version: string;
  installing: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-primary/10 px-3 py-1.5 text-xs">
      <Download className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="flex-1 text-foreground/80">
        v{version} available
      </span>
      <button
        onClick={onInstall}
        disabled={installing}
        className="rounded px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
      >
        {installing ? "Installing…" : "Install now"}
      </button>
      <button
        onClick={onDismiss}
        disabled={installing}
        className="rounded px-2 py-0.5 text-xs text-foreground/50 hover:text-foreground/80 disabled:opacity-50"
      >
        Later
      </button>
      <button
        onClick={onDismiss}
        disabled={installing}
        className="rounded p-0.5 text-foreground/40 hover:text-foreground/70"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function App() {
  const [activeToolId, setActiveToolId] = useState(
    () => getLastToolId() ?? "home",
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (activeToolId !== "home" && activeToolId !== "settings") {
      setLastToolId(activeToolId);
    }
  }, [activeToolId]);

  useEffect(() => {
    const unlisten = listen<string>("tray-select-tool", (event) => {
      if (toolsById[event.payload]) {
        setActiveToolId(event.payload);
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    loadSettings().then(async (settings) => {
      if (settings.theme === "custom") {
        const custom = await loadCustomTheme();
        applyTokens(custom.tokens, custom.isDark);
      } else {
        const preset = PRESETS_BY_ID[settings.theme] ?? DARK_PRESET;
        applyTokens(preset.tokens, preset.isDark);
      }
      if (settings.shortcut !== DEFAULT_SHORTCUT) {
        invoke("set_global_shortcut", { old: DEFAULT_SHORTCUT, new: settings.shortcut });
      }
      invoke("rebuild_tray_menu", {
        pinned: settings.pinnedTools.map((id) => [id, toolsById[id]?.name ?? id]),
      });

      if (settings.checkUpdatesOnStartup && navigator.onLine) {
        invoke<string | null>("check_update").then((version) => {
          if (version) setPendingUpdate(version);
        }).catch(() => {});
      }
    });
  }, []);

  const handleCheckUpdate = useCallback(async (): Promise<string | null> => {
    try {
      const version = await invoke<string | null>("check_update");
      if (version) setPendingUpdate(version);
      return version;
    } catch {
      return null;
    }
  }, []);

  const handleInstallUpdate = useCallback(async () => {
    setInstalling(true);
    try {
      await invoke("install_update");
    } catch {
      setInstalling(false);
    }
  }, []);

  const handleDismissUpdate = useCallback(() => {
    setPendingUpdate(null);
  }, []);

  const handleSelectTool = useCallback((id: string) => {
    setActiveToolId(id);
    setPaletteOpen(false);
  }, []);

  const isVisible = useRef(document.visibilityState === "visible");
  useEffect(() => {
    const handler = () => {
      isVisible.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const activeTool = toolsById[activeToolId];

  function renderContent() {
    if (activeToolId === "home") return <Home onSelectTool={handleSelectTool} />;
    if (activeToolId === "settings") {
      return (
        <Settings
          pendingUpdate={pendingUpdate}
          onCheckUpdate={handleCheckUpdate}
          onInstallUpdate={handleInstallUpdate}
          onDismissUpdate={handleDismissUpdate}
          onSaveSettings={async (next) => {
            await saveSettings(next);
          }}
        />
      );
    }
    const ActiveComponent = activeTool?.component;
    if (!ActiveComponent) return null;
    return (
      <Suspense fallback={null}>
        <ActiveComponent />
      </Suspense>
    );
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar activeToolId={activeToolId} onSelect={setActiveToolId} />
      <div className="flex min-w-0 flex-1 flex-col">
        {pendingUpdate && !installing && (
          <UpdateBanner
            version={pendingUpdate}
            installing={installing}
            onInstall={handleInstallUpdate}
            onDismiss={handleDismissUpdate}
          />
        )}
        {installing && (
          <div className="flex items-center gap-2 border-b border-border bg-primary/10 px-3 py-1.5 text-xs text-foreground/70">
            <Download className="h-3.5 w-3.5 animate-pulse text-primary" />
            Downloading update…
          </div>
        )}
        <Topbar
          activeTool={activeTool}
          activeToolId={activeToolId}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenSettings={() => setActiveToolId("settings")}
        />
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handleSelectTool}
      />
    </main>
  );
}

export default App;
