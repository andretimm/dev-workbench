import type { ThemePreset, ThemeTokens } from "./types";

function make(
  background: string, foreground: string, card: string,
  primary: string, primaryForeground: string,
  muted: string, mutedForeground: string,
  border: string, sidebar: string, destructive: string,
  extra: Partial<ThemeTokens> = {}
): ThemeTokens {
  return {
    background,
    foreground,
    card,
    cardForeground:      foreground,
    popover:             card,
    popoverForeground:   foreground,
    primary,
    primaryForeground,
    secondary:           muted,
    secondaryForeground: foreground,
    muted,
    mutedForeground,
    accent:              primary,
    accentForeground:    primaryForeground,
    destructive,
    border,
    input:               border,
    ring:                primary,
    sidebar,
    sidebarForeground:   foreground,
    sidebarBorder:       border,
    ...extra,
  };
}

export const LIGHT_PRESET: ThemePreset = {
  id: "light", name: "Light", isDark: false,
  tokens: make(
    "oklch(0.97  0.008 264)", "oklch(0.145 0.04  264)",
    "oklch(0.99  0.004 264)",
    "oklch(0.55  0.22  264)", "oklch(0.985 0     0  )",
    "oklch(0.935 0.015 264)", "oklch(0.50  0.05  264)",
    "oklch(0.145 0.04  264 / 0.12)", "oklch(0.955 0.015 264)",
    "oklch(0.577 0.245 27.3)",
    { input: "oklch(0.145 0.04 264 / 0.08)" }
  ),
};

export const DARK_PRESET: ThemePreset = {
  id: "dark", name: "Dark", isDark: true,
  tokens: make(
    "oklch(0.085 0.028 264)", "oklch(0.92  0.015 264)",
    "oklch(0.115 0.028 264)",
    "oklch(0.55  0.22  264)", "oklch(0.985 0     0  )",
    "oklch(0.175 0.03  264)", "oklch(0.52  0.05  264)",
    "oklch(1     0     0   / 0.09)", "oklch(0.095 0.028 264)",
    "oklch(0.65  0.21  22 )",
    {
      popover:     "oklch(0.125 0.028 264)",
      input:       "oklch(1 0 0 / 0.07)",
      sidebarBorder: "oklch(1 0 0 / 0.08)",
    }
  ),
};

export const DRACULA_PRESET: ThemePreset = {
  id: "dracula", name: "Dracula", isDark: true,
  tokens: make(
    "#282a36", "#f8f8f2",
    "#21222c",
    "#bd93f9", "#f8f8f2",
    "#44475a", "#6272a4",
    "oklch(1 0 0 / 0.10)", "#21222c",
    "#ff5555",
    { input: "oklch(1 0 0 / 0.07)" }
  ),
};

export const ATOM_ONE_DARK_PRESET: ThemePreset = {
  id: "atom-one-dark", name: "Atom One Dark", isDark: true,
  tokens: make(
    "#282c34", "#abb2bf",
    "#21252b",
    "#528bff", "#ffffff",
    "#2c313a", "#5c6370",
    "oklch(1 0 0 / 0.08)", "#21252b",
    "#e06c75",
    { input: "#1b1d23" }
  ),
};

export const PRESETS: ThemePreset[] = [
  LIGHT_PRESET,
  DARK_PRESET,
  DRACULA_PRESET,
  ATOM_ONE_DARK_PRESET,
];

export const PRESETS_BY_ID: Record<string, ThemePreset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p])
);
