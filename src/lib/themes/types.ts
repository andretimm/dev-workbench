export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarBorder: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  isDark: boolean;
  tokens: ThemeTokens;
}

export interface CustomTheme {
  isDark: boolean;
  tokens: ThemeTokens;
}

export const TOKEN_TO_CSS: Record<keyof ThemeTokens, string> = {
  background:           "--background",
  foreground:           "--foreground",
  card:                 "--card",
  cardForeground:       "--card-foreground",
  popover:              "--popover",
  popoverForeground:    "--popover-foreground",
  primary:              "--primary",
  primaryForeground:    "--primary-foreground",
  secondary:            "--secondary",
  secondaryForeground:  "--secondary-foreground",
  muted:                "--muted",
  mutedForeground:      "--muted-foreground",
  accent:               "--accent",
  accentForeground:     "--accent-foreground",
  destructive:          "--destructive",
  border:               "--border",
  input:                "--input",
  ring:                 "--ring",
  sidebar:              "--sidebar",
  sidebarForeground:    "--sidebar-foreground",
  sidebarBorder:        "--sidebar-border",
};

export const EDITABLE_TOKENS: Array<{ key: keyof ThemeTokens; label: string }> = [
  { key: "background",      label: "Background" },
  { key: "foreground",      label: "Text" },
  { key: "primary",         label: "Accent" },
  { key: "primaryForeground", label: "Accent text" },
  { key: "card",            label: "Card / Panel" },
  { key: "sidebar",         label: "Sidebar" },
  { key: "muted",           label: "Muted area" },
  { key: "mutedForeground", label: "Muted text" },
  { key: "border",          label: "Border" },
  { key: "destructive",     label: "Error" },
];
