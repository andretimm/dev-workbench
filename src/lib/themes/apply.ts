import type { ThemeTokens } from "./types";
import { TOKEN_TO_CSS } from "./types";

export function applyTokens(tokens: ThemeTokens, isDark: boolean): void {
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);

  for (const key of Object.keys(TOKEN_TO_CSS) as (keyof ThemeTokens)[]) {
    root.style.setProperty(TOKEN_TO_CSS[key], tokens[key]);
  }

  root.style.setProperty("--sidebar-ring",                  tokens.ring);
  root.style.setProperty("--sidebar-primary",               tokens.primary);
  root.style.setProperty("--sidebar-primary-foreground",    tokens.primaryForeground);
  root.style.setProperty("--sidebar-accent",                tokens.accent);
  root.style.setProperty("--sidebar-accent-foreground",     tokens.accentForeground);
}
