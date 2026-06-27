import { load, type Store } from "@tauri-apps/plugin-store";
import type { CustomTheme } from "./types";

export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  isDark: true,
  tokens: {
    background:          "#0e0e1a",
    foreground:          "#e3e4f0",
    card:                "#131525",
    cardForeground:      "#e3e4f0",
    popover:             "#141627",
    popoverForeground:   "#e3e4f0",
    primary:             "#6366f1",
    primaryForeground:   "#ffffff",
    secondary:           "#1e1f30",
    secondaryForeground: "#e3e4f0",
    muted:               "#1e1f30",
    mutedForeground:     "#7a7ea0",
    accent:              "#6366f1",
    accentForeground:    "#ffffff",
    destructive:         "#ef4444",
    border:              "#2a2b40",
    input:               "#2a2b40",
    ring:                "#6366f1",
    sidebar:             "#0f0f1e",
    sidebarForeground:   "#e3e4f0",
    sidebarBorder:       "#2a2b40",
  },
};

let storePromise: Promise<Store> | null = null;

function getStore() {
  storePromise ??= load("themes.json", { defaults: {}, autoSave: true });
  return storePromise;
}

export async function loadCustomTheme(): Promise<CustomTheme> {
  try {
    const store = await getStore();
    const saved = await store.get<CustomTheme>("custom");
    return saved ?? DEFAULT_CUSTOM_THEME;
  } catch {
    return DEFAULT_CUSTOM_THEME;
  }
}

export async function saveCustomTheme(theme: CustomTheme): Promise<void> {
  const store = await getStore();
  await store.set("custom", theme);
}
