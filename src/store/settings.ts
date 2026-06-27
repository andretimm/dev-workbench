import { load, type Store } from "@tauri-apps/plugin-store";

export type ThemeId = "light" | "dark" | "dracula" | "atom-one-dark" | "custom";

export type Theme = ThemeId;

export interface Settings {
  theme: ThemeId;
  shortcut: string;
  pinnedTools: string[];
  launchAtLogin: boolean;
  checkUpdatesOnStartup: boolean;
}

export const DEFAULT_SHORTCUT = "CmdOrCtrl+Shift+Space";

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark" as ThemeId,
  shortcut: DEFAULT_SHORTCUT,
  pinnedTools: ["json-formatter", "base64", "jwt-decoder", "timestamp"],
  launchAtLogin: false,
  checkUpdatesOnStartup: true,
};

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  storePromise ??= load("settings.json", { defaults: {}, autoSave: true });
  return storePromise;
}

export async function loadSettings(): Promise<Settings> {
  const store = await getStore();
  const saved = await store.get<Settings>("settings");
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const store = await getStore();
  await store.set("settings", settings);
}
