# Dev Workbench

> Your dev toolbox, one shortcut away.

A native **macOS menu-bar app** that keeps the small text and data tools a developer uses all day one keystroke away — JSON formatter, JWT decoder, Base64, regex tester, diff, hash generator, and more. Fully offline. Nothing leaves your machine.

---

## Download

Go to [**Releases**](../../releases/latest) and download the `.dmg` for your Mac (universal build — runs natively on Apple Silicon and Intel).

Open the `.dmg`, drag **Dev Workbench** to Applications.

---

### ⚠️ Gatekeeper warning — app is not signed

Dev Workbench is not code-signed or notarized with an Apple Developer certificate. macOS Gatekeeper will block the first launch with the message *"Dev Workbench.app was not opened"*. This is expected — the app is safe. Pick one of the methods below to allow it:

**Option A — System Settings (recommended)**

1. Click **OK** on the Gatekeeper dialog
2. Open **System Settings → Privacy & Security**
3. Scroll down to find *"Dev Workbench.app was blocked from use"*
4. Click **Open Anyway** and confirm

**Option B — Right-click in Finder**

Right-click (or Control-click) the app in Finder → **Open** → click **Open** in the dialog that appears.

**Option C — Terminal**

```bash
xattr -d com.apple.quarantine /Applications/Dev\ Workbench.app
```

You only need to do this once. After the first approval, macOS remembers the exception.

---

---

## Features

- **Menu-bar popover** — click the tray icon or press `⌘⇧Space` (configurable) to toggle
- **Command palette** (`⌘K`) — fuzzy-search across all tools
- **19 built-in tools**
  - Encoding: Base64, URL encoder, HTML entities, Hash generator (MD5 / SHA-1 / SHA-256), UUID generator
  - Text: Regex tester, Text diff, Case converter, Slug generator, Lorem ipsum, Markdown preview
  - Time: Timestamp converter, Cron parser
  - Web: JWT decoder, JWT encoder, Color converter
  - Format: JSON formatter, JSON↔YAML, Number base converter
- **Custom themes** — Light, Dark, Dracula, Atom One Dark, or build your own with live color-picker preview
- **Launch at login**, auto-hides on focus loss, close hides (not quits)

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Shell | [Tauri 2.x](https://tauri.app) (Rust core + WKWebView frontend) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Components | shadcn/ui + lucide-react |
| Tauri plugins | `global-shortcut`, `positioner`, `autostart`, `store` |

The Rust side is intentionally thin: it owns the tray icon, window lifecycle, global shortcut, and native commands that genuinely need it. Everything else is TypeScript.

---

## Running in dev mode

**Prerequisites:** Node.js ≥ 20, Rust (stable), Xcode Command Line Tools.

```bash
git clone https://github.com/<you>/workbench.git
cd workbench
npm install
npm run tauri dev
```

The frontend hot-reloads; Rust recompiles on change. The window starts hidden — click the `{}` tray icon (or press the global shortcut) to open it.

Useful scripts:

```bash
npm run typecheck   # TypeScript check
npm run lint        # ESLint
npm test            # Vitest (106 tests)
npm run build       # Frontend-only production build
npm run tauri build -- --target universal-apple-darwin  # Full macOS app bundle
```

---

## Architecture: the Tool Registry

Every tool is a **self-contained module** that registers itself in one place. The sidebar, command palette, and tray pinned-tools are all generated from this registry — no hardcoded navigation anywhere.

```
src/
  lib/tool.ts          ← Tool interface
  tools/
    registry.ts        ← THE only place tools are wired in
    json-formatter/
      index.ts         ← exports the Tool object
      JsonFormatter.tsx
    base64/
    ...
```

### Adding a new tool — 3 steps

**1. Create the tool directory**

```
src/tools/my-tool/
  index.ts
  MyTool.tsx
```

**`index.ts`** — declare the tool's metadata:

```ts
import { Wrench } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { MyTool } from "./MyTool";

export const myTool: Tool = {
  id: "my-tool",           // stable kebab-case ID
  name: "My Tool",
  category: "text",        // "encoding" | "text" | "time" | "web" | "format"
  icon: Wrench,            // any lucide-react icon
  keywords: ["keyword1"],  // for fuzzy search / command palette
  component: MyTool,
};
```

**`MyTool.tsx`** — the UI (all state is local; no network calls ever):

```tsx
import { useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { CopyButton } from "@/components/CopyButton";

export function MyTool() {
  const [input, setInput] = useState("");
  const output = input.toUpperCase(); // your logic here

  return (
    <ToolShell title="My Tool" actions={<CopyButton text={output} />}>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
      <pre>{output}</pre>
    </ToolShell>
  );
}
```

**2. Register it** — one line in `src/tools/registry.ts`:

```ts
import { myTool } from "./my-tool";   // add import

export const tools: Tool[] = [
  // ...existing tools...
  myTool,                              // add here
];
```

That's it. The sidebar, command palette, and tray menu all pick it up automatically.

**3. Add a test** (recommended)

Put business logic in a plain TS file (`my-tool/logic.ts`) and test it with Vitest:

```ts
// src/tools/my-tool/logic.test.ts
import { describe, it, expect } from "vitest";
import { myLogic } from "./logic";

describe("myLogic", () => {
  it("does the thing", () => {
    expect(myLogic("hello")).toBe("HELLO");
  });
});
```

### Rules for tool authors

- All processing is **client-side and synchronous** where possible
- **No network calls** — ever. If you need native compute (e.g. file hashing), call a Rust `invoke` command, not HTTP
- Tools must **not import each other**
- All state is **local** (`useState` / `useReducer`) — no global store for tool content

---

## Releasing a new version

1. Bump `"version"` in `src-tauri/tauri.conf.json`
2. Push to `main`
3. GitHub Actions builds a universal macOS binary, creates a git tag `v<version>`, and publishes a GitHub Release with the `.dmg`

The workflow (`.github/workflows/release.yml`) skips the release step if the current version tag already exists, so pushing to `main` without bumping the version is safe for non-release changes.

---

## Theme system

Themes are token maps — a JSON object of CSS custom properties. Four presets ship out of the box:

| Theme | Accent |
|-------|--------|
| Light | Indigo |
| Dark | Indigo |
| Dracula | Purple `#bd93f9` |
| Atom One Dark | Blue `#61afef` |

The **Custom** theme lets you edit 10 key color tokens with a live preview and a native OS color picker. Custom themes are saved to `~/Library/Application Support/com.andretimm.bancada/themes.json`.

---

## Project structure

```
src/
  components/        UI chrome (Sidebar, Topbar, CommandPalette, Settings, Home)
  lib/
    themes/          Token types, 4 presets, CSS injection, custom theme store
    clipboard.ts     Copy helper
    fuzzy.ts         Fuzzy search for the command palette
  store/settings.ts  Tauri-plugin-store wrapper (theme, shortcut, pinned tools)
  tools/             One directory per tool + registry.ts
src-tauri/
  src/lib.rs         Tray, window lifecycle, global shortcut, Rust commands
  tauri.conf.json    Window config, app identity, bundle settings
  capabilities/      Tauri permission grants
.github/workflows/
  release.yml        Build + release on every push to main
```
