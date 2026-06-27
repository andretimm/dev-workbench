# Bancada Dev Toolbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a macOS-only menu bar dev toolbox (Tauri 2 + React/TS) with 8 offline tools, a tool registry, command palette, and persisted settings, per `tasks/prd-bancada-toolbox.md` and `CLAUDE.md`.

**Architecture:** Rust (`src-tauri`) owns only the tray icon, window lifecycle (Accessory policy, close-hides, anchoring, global shortcut, autostart) and the one native command that earns it (MD5). Everything else — registry, sidebar, command palette, all 8 tools, settings UI — is pure TypeScript/React, generated from a single `Tool[]` registry with zero hardcoded navigation.

**Tech Stack:** Tauri 2.x, React 18, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, lucide-react, Vitest, `tauri-plugin-{global-shortcut,positioner,autostart,store}`.

## Global Constraints

- Offline-only: zero network requests, zero telemetry, anywhere in the app.
- macOS only, universal binary (`aarch64-apple-darwin` + `x86_64-apple-darwin`).
- Tool registry pattern is non-negotiable: a new tool = one file under `src/tools/<id>/` + one line in `src/tools/registry.ts`. Tools never import each other or reference navigation/tray/other tools' state.
- Tailwind v4 has no `init` command and no PostCSS config — only `@tailwindcss/vite` + a single `@import "tailwindcss";`.
- Typecheck (`tsc --noEmit`) and lint must pass before any task is considered done.
- Tray icon must be a monochrome **template image** (adapts to light/dark menu bar).
- `prevent_close()` on the main window is mandatory — its absence quits the app on close, breaking the entire UX.
- `ActivationPolicy::Accessory` is mandatory — its absence puts a Dock icon on the app.
- No JWT signature verification — decode only, stated in the UI.
- Commit messages: plain, no `Co-Authored-By` trailer (project convention for this repo).
- `claude-design-prompt.md` referenced by CLAUDE.md does **not exist** in the repo as of this plan. Task 17 (polish) uses the PRD's "Design Considerations" section as the substitute brief; flag to the user if a real design file shows up before then.
- **Safety rule added after an incident during Task 1's first attempt:** before any subagent runs a scaffolding/codegen CLI that writes into the repo root (`npm create *`, `*  init --force`, etc.), the controller must have already committed every pre-existing file in the working tree. A bare `git init` with zero commits is not protection — `npm create tauri-app -- --force` deleted `CLAUDE.md`, `tasks/`, and `docs/` from this exact repo once already. Commit first, scaffold second.

## File Structure

```
src/
  lib/
    tool.ts            # Tool interface + ToolCategory (Task 6)
    clipboard.ts        # copyToClipboard helper (Task 8)
    fuzzy.ts            # fuzzyMatch/fuzzyScore for sidebar + palette (Task 6)
  components/
    ui/                 # shadcn/ui generated components (Task 1+)
    ToolShell.tsx       # shared input/output layout (Task 8)
    CopyButton.tsx       # copy-to-clipboard button (Task 8)
    Sidebar.tsx          # generated from registry (Task 6)
    CommandPalette.tsx   # Cmd+K overlay (Task 7)
    Settings.tsx          # Task 16
  tools/
    registry.ts          # the one place tools are wired (Task 6)
    json-formatter/{index.ts,JsonFormatter.tsx,format.ts}      # Task 8
    base64/{index.ts,Base64Tool.tsx,base64.ts}                 # Task 9
    jwt-decoder/{index.ts,JwtDecoder.tsx,decode.ts}            # Task 10
    timestamp/{index.ts,TimestampConverter.tsx,convert.ts}     # Task 11
    regex-tester/{index.ts,RegexTester.tsx,match.ts}           # Task 12
    text-diff/{index.ts,TextDiff.tsx}                          # Task 13
    color-converter/{index.ts,ColorConverter.tsx,convert.ts}   # Task 14
    hash-generator/{index.ts,HashGenerator.tsx,hash.ts}        # Task 15
  store/
    settings.ts          # tauri-plugin-store wrapper (Task 16)
  App.tsx                 # tool router driven by registry + active-tool state (Task 6)
  main.tsx
  index.css               # @import "tailwindcss"; (Task 1)
src-tauri/
  src/
    lib.rs                # tray, activation policy, window lifecycle, commands (Tasks 2-5, 15)
    main.rs
  tauri.conf.json
  Cargo.toml
```

---

### Task 1: Project scaffold (US-001)

**Files:**
- Create: entire `bancada/` Tauri+Vite+React+TS scaffold (root of this repo)
- Modify: `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `src/index.css`, `src/App.tsx`
- Create: `components.json` (shadcn), `vitest.config.ts`, `src/App.test.tsx`

**Interfaces:**
- Produces: a running Vite+React+TS app with `@/` alias resolving to `src/`, Tailwind v4 utilities available, one shadcn `Button` rendering, `npm run typecheck`, `npm run lint`, `npm run test` scripts.

- [ ] **Step 0: Protect existing files before running any scaffolding tool**

Before anything else, commit every file already in the repo root (`CLAUDE.md`, `tasks/`, `docs/`, any other pre-existing files):

```bash
git add -A
git commit -m "chore: snapshot pre-existing project docs before scaffold"
```

Do not run `npm create tauri-app` or any `--force` codegen command until this commit exists. (Context: the first attempt at this task ran the scaffold command with `--force` into a non-empty, zero-commit repo and it silently deleted `CLAUDE.md`, `tasks/`, and `docs/`. This step exists specifically to make that recoverable via `git checkout` if it ever happens again.)

- [ ] **Step 1: Scaffold with create-tauri-app**

The repo root already contains non-Tauri files (`CLAUDE.md`, `tasks/`, `docs/`, possibly `.claude/`, `.git/`). `create-tauri-app` will refuse to run in a non-empty directory without forcing it, and forcing it can overwrite/delete unrelated files. Scaffold into a throwaway temp directory instead, then move only the generated files into the repo root:

```bash
cd /tmp
npm create tauri-app@latest bancada-scaffold-tmp -- --template react-ts --manager npm --yes
```

If it prompts interactively instead of honoring flags, answer: package manager `npm`, UI template `React`, flavor `TypeScript`, app name `bancada`, window title `Bancada`.

Then move the generated contents into the repo root, without touching anything already there:

```bash
cd /tmp/bancada-scaffold-tmp
cp -R . /Users/andretimm/dev/timm/workbanch/
cd /Users/andretimm/dev/timm/workbanch
git status
```

Inspect `git status` output carefully — it must show only new files being added (package.json, src/, src-tauri/, index.html, vite.config.ts, tsconfig*.json, etc.), and `CLAUDE.md`/`tasks/`/`docs/` must NOT appear as deleted or modified. If anything pre-existing shows as deleted or modified, STOP and report BLOCKED before going further — do not commit.

Clean up the temp directory once confirmed safe:

```bash
rm -rf /tmp/bancada-scaffold-tmp
```

- [ ] **Step 2: Verify dev server boots**

```bash
npm install
npm run tauri dev
```

Expected: a default Tauri window opens showing the Vite+React starter page. Stop it (Ctrl+C) once confirmed.

- [ ] **Step 3: Install Tailwind v4 via the Vite plugin (no `init`)**

```bash
npm install tailwindcss @tailwindcss/vite
```

Edit `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
});
```

Replace the entire contents of `src/index.css` (or `src/App.css` if that's what the template uses — check which file `main.tsx` imports) with:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Add the `@/` path alias to TypeScript config**

Edit `tsconfig.json` to add under `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Edit `tsconfig.app.json` (the config that actually type-checks `src/`) the same way — add the identical `baseUrl`/`paths` block to its `compilerOptions`.

- [ ] **Step 5: Install shadcn/ui and a sample Button**

```bash
npx shadcn@latest init
```

When prompted: base color `neutral`, CSS variables `yes`. It should detect Vite + Tailwind v4 and not ask for a `tailwind.config.js` path.

```bash
npx shadcn@latest add button
```

Edit `src/App.tsx` to render it as a smoke test:

```tsx
import { Button } from "@/components/ui/button";

function App() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background">
      <Button>Bancada</Button>
    </main>
  );
}

export default App;
```

- [ ] **Step 6: Add Vitest**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Create `vitest.config.ts`:

```typescript
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
    },
  }),
);
```

Create `src/App.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the Bancada button", () => {
    render(<App />);
    expect(screen.getByText("Bancada")).toBeInTheDocument();
  });
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"typecheck": "tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json"`.

- [ ] **Step 7: Run verification**

```bash
npm run typecheck
npm run test
npm run tauri dev
```

Expected: typecheck clean, test passes (1 passed), window shows a centered "Bancada" button styled by Tailwind/shadcn. Visually confirm, then close.

- [ ] **Step 8: Universal build check**

```bash
npm run tauri build -- --target universal-apple-darwin
```

Expected: produces `src-tauri/target/universal-apple-darwin/release/bundle/macos/Bancada.app`. This step can be slow (Rust release build) — run once now to catch toolchain issues early, not after every later task.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Tauri 2 + React + TS + Vite + Tailwind v4 + shadcn/ui"
```

No `Co-Authored-By` trailer (project convention).

---

### Task 2: Tray icon + Accessory activation policy (US-002)

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/icons/tray-icon.png` (template image — reuse the default Tauri icon converted to a monochrome 22x22 template, or generate one; must have alpha channel, black-on-transparent)
- Modify: `src-tauri/tauri.conf.json` (window starts hidden)

**Interfaces:**
- Produces: a running app with a tray icon visible in the menu bar and no Dock icon. No JS-facing API yet (that's Task 3).

- [ ] **Step 1: Set the activation policy and build the tray in `setup`**

Edit `src-tauri/src/lib.rs`:

```rust
use tauri::tray::TrayIconBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let _tray = TrayIconBuilder::new()
                .icon(tauri::image::Image::from_path("icons/tray-icon.png")?)
                .icon_as_template(true)
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 2: Start the window hidden**

Edit `src-tauri/tauri.conf.json`, set on the main window entry:

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "visible": false,
        "title": "Bancada"
      }
    ]
  }
}
```

- [ ] **Step 3: Run and verify visually**

```bash
npm run tauri dev
```

Expected: no window appears on launch, no Dock icon, no entry in Cmd+Tab app switcher, a small icon appears in the menu bar near the system clock. Quit via `cmd-tab` is impossible (expected — no Quit wiring yet, kill via `npm run tauri dev`'s terminal Ctrl+C for now).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: tray icon + Accessory activation policy, no Dock icon"
```

---

### Task 3: Toggle window from tray + global shortcut + anchoring + auto-hide (US-003)

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`, `package.json` (add `tauri-plugin-positioner`, `tauri-plugin-global-shortcut`)
- Modify: `src-tauri/tauri.conf.json` (`alwaysOnTop`, `decorations`, `transparent`)
- Modify: `src/main.tsx` or new `src/lib/window.ts` (focus search input on show — wired fully once Task 7's input exists; for now expose a DOM hook)

**Interfaces:**
- Consumes: tray from Task 2.
- Produces: `toggle_window()` behavior reachable from tray left-click AND the global shortcut; a `window-shown` event on the JS side other code can subscribe to (used later by Task 7 to focus the palette input).

- [ ] **Step 1: Add plugins**

```bash
npm run tauri add positioner
npm run tauri add global-shortcut
```

This updates `Cargo.toml`, `src-tauri/src/lib.rs` plugin registration, and adds the matching npm packages (`@tauri-apps/plugin-positioner`, `@tauri-apps/plugin-global-shortcut`) automatically.

- [ ] **Step 2: Wire tray click + positioner + a shared toggle function**

Edit `src-tauri/src/lib.rs`:

```rust
use tauri::{
    Manager, Emitter,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_positioner::{Position, WindowExt};

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.as_ref().window().move_window(Position::TrayCenter);
            let _ = window.show();
            let _ = window.set_focus();
            let _ = app.emit("window-shown", ());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut| {
                    toggle_window(app);
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            app.global_shortcut().register("CmdOrCtrl+Shift+Space")?;

            let tray = TrayIconBuilder::new()
                .icon(tauri::image::Image::from_path("icons/tray-icon.png")?)
                .icon_as_template(true)
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;
            let _ = tray;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Add `use tauri_plugin_global_shortcut::GlobalShortcutExt;` to the imports.

- [ ] **Step 3: Auto-hide on blur + focus the search input on show**

Create `src/lib/window.ts`:

```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

export function setupWindowBehavior(onShown: () => void) {
  const appWindow = getCurrentWindow();

  appWindow.onFocusChanged(({ payload: focused }) => {
    if (!focused) {
      appWindow.hide();
    }
  });

  listen("window-shown", onShown);
}
```

Wire it in `src/main.tsx` after the React root mounts:

```typescript
import { setupWindowBehavior } from "@/lib/window";

setupWindowBehavior(() => {
  document.getElementById("search-input")?.focus();
});
```

(`#search-input` doesn't exist until Task 7 — this is a no-op `querySelector` miss until then, which is fine.)

- [ ] **Step 4: Popover window chrome**

Edit `src-tauri/tauri.conf.json` main window entry:

```json
{
  "label": "main",
  "visible": false,
  "title": "Bancada",
  "width": 720,
  "height": 480,
  "resizable": true,
  "alwaysOnTop": true,
  "decorations": false,
  "transparent": true,
  "skipTaskbar": true
}
```

- [ ] **Step 5: Verify visually**

```bash
npm run tauri dev
```

Manually check: left-click tray icon shows the window anchored near the top-right under the menu bar; click again hides it; `Cmd+Shift+Space` toggles it from any other app; clicking outside the window hides it.

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add -A
git commit -m "feat: toggle window from tray + global shortcut, popover anchoring, auto-hide on blur"
```

---

### Task 4: Close hides instead of quitting + restore last active tool (US-004)

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src/lib/lastTool.ts`
- Modify: `src/App.tsx` (read/write last active tool — wired fully once Task 6's registry/active-tool state exists, so this task only adds the in-memory module; App.tsx wiring happens in Task 6)

**Interfaces:**
- Produces: `getLastToolId(): string | null`, `setLastToolId(id: string): void` (in-memory, module-level — resets on full app restart per PRD's MVP decision).

- [ ] **Step 1: Intercept window close**

Edit `src-tauri/src/lib.rs`, inside `.setup`, after building the tray, add a close handler on the main window:

```rust
if let Some(window) = app.get_webview_window("main") {
    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = window_clone.hide();
        }
    });
}
```

- [ ] **Step 2: Esc hides the window (Cmd+W is the OS-level close control and already triggers `CloseRequested`, so Step 1 covers it)**

Create `src/lib/escape.ts`:

```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";

export function setupEscapeHide() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      getCurrentWindow().hide();
    }
  });
}
```

Call `setupEscapeHide()` in `src/main.tsx` alongside `setupWindowBehavior(...)`.

- [ ] **Step 3: Only tray "Quit" actually exits — `Cmd+Q` must NOT quit**

**Spec amendment (post-launch, after human testing on Tasks 4-5):** the original brief assumed Cmd+Q would quit by default and treated that as acceptable. Live testing showed Esc/Cmd+W also weren't reliably hiding the window (an Accessory-policy/LSUIElement window doesn't necessarily have OS-level keyboard focus just because `set_focus()` was called — a known Tauri macOS tray-app gotcha), and the user decided the only quit path should be the tray menu's "Quit Bancada" item — no keyboard path to quit at all, so the app can never be killed by a stray keystroke. This was fixed in a follow-up commit after Task 5 (see the plan's progress ledger / git log for the exact commit), not as a numbered step rewrite here, but any future re-implementation of this task must build it this way from the start:
- On window show (tray click, global shortcut, or menu item), explicitly activate the app (not just `window.set_focus()`) so the webview actually receives keyboard events — research the current Tauri 2 recommended approach (likely an explicit NSApplication activate call on macOS) rather than assuming `set_focus()` alone is sufficient.
- Do not rely on any default/implicit macOS menu-bar Cmd+Q binding. If Tauri auto-generates a default application menu, explicitly override/remove any Quit accelerator from it, or otherwise neutralize Cmd+Q so it has no effect on the running app.
- The tray menu's "Quit Bancada" item itself should have no keyboard accelerator either (mouse-click only) — this removes any ambiguity about a hidden keyboard path to quit.

- [ ] **Step 4: In-memory last-active-tool module**

Create `src/lib/lastTool.ts`:

```typescript
let lastToolId: string | null = null;

export function getLastToolId(): string | null {
  return lastToolId;
}

export function setLastToolId(id: string): void {
  lastToolId = id;
}
```

- [ ] **Step 5: Write the unit test**

Create `src/lib/lastTool.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getLastToolId, setLastToolId } from "./lastTool";

describe("lastTool", () => {
  beforeEach(() => {
    setLastToolId(null as unknown as string);
  });

  it("returns null before anything is set", () => {
    expect(getLastToolId()).toBeNull();
  });

  it("returns the most recently set id", () => {
    setLastToolId("json-formatter");
    setLastToolId("base64");
    expect(getLastToolId()).toBe("base64");
  });
});
```

Run: `npm run test`. Expected: both pass.

- [ ] **Step 6: Verify visually**

```bash
npm run tauri dev
```

Manually check: `Cmd+W` and `Esc` hide the window without killing the process (tray icon stays); `Cmd+Q` while the window is focused does NOT quit the app (per the spec amendment in Task 5's Step 3 — only the tray "Quit Bancada" item quits).

- [ ] **Step 7: Typecheck + commit**

```bash
npm run typecheck
npm run test
git add -A
git commit -m "feat: close/Esc/Cmd+W hide instead of quit; add in-memory last-active-tool tracking"
```

---

### Task 5: Tray context menu (US-005)

**Files:**
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `toggle_window`/show logic from Task 3.
- Produces: a `tray-select-tool` JS event carrying a tool id string, emitted when a pinned-tool menu item is clicked. (No subscriber yet — wired in Task 6 once the registry/active-tool state exists.)

- [ ] **Step 1: Build the native menu**

Edit `src-tauri/src/lib.rs`. Add imports:

```rust
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
```

Inside `.setup`, before building the tray, construct the menu (pinned tools are hardcoded here for now as the 6 MVP tools most likely to be pinned by default — Task 16 makes this user-configurable and re-builds the menu from settings):

```rust
let open_item = MenuItemBuilder::with_id("open", "Open Bancada").build(app)?;
let json_item = MenuItemBuilder::with_id("tool:json-formatter", "JSON Formatter").build(app)?;
let base64_item = MenuItemBuilder::with_id("tool:base64", "Base64").build(app)?;
let jwt_item = MenuItemBuilder::with_id("tool:jwt-decoder", "JWT Decoder").build(app)?;
let timestamp_item = MenuItemBuilder::with_id("tool:timestamp", "Timestamp Converter").build(app)?;
let separator1 = PredefinedMenuItem::separator(app)?;
let settings_item = MenuItemBuilder::with_id("settings", "Settings…").build(app)?;
let separator2 = PredefinedMenuItem::separator(app)?;
// No keyboard accelerator on purpose (spec amendment, Task 5 Step 3): the
// tray menu is the app's only quit path, so it can't be killed by a stray
// Cmd+Q. Do not add .accelerator("CmdOrCtrl+Q") here.
let quit_item = MenuItemBuilder::with_id("quit", "Quit Bancada")
    .build(app)?;

let menu = MenuBuilder::new(app)
    .items(&[
        &open_item,
        &json_item,
        &base64_item,
        &jwt_item,
        &timestamp_item,
        &separator1,
        &settings_item,
        &separator2,
        &quit_item,
    ])
    .build()?;
```

- [ ] **Step 2: Wire menu events**

Attach `.menu(&menu)` and `.on_menu_event(...)` to the `TrayIconBuilder`:

```rust
let tray = TrayIconBuilder::new()
    .icon(tauri::image::Image::from_path("icons/tray-icon.png")?)
    .icon_as_template(true)
    .menu(&menu)
    .show_menu_on_left_click(false)
    .on_menu_event(|app, event| match event.id().as_ref() {
        "open" => toggle_window_show(app),
        "settings" => {
            toggle_window_show(app);
            let _ = app.emit("tray-select-tool", "settings");
        }
        "quit" => app.exit(0),
        id if id.starts_with("tool:") => {
            toggle_window_show(app);
            let _ = app.emit("tray-select-tool", id.trim_start_matches("tool:"));
        }
        _ => {}
    })
    .on_tray_icon_event(|tray, event| {
        tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
        if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } = event
        {
            toggle_window(tray.app_handle());
        }
    })
    .build(app)?;
```

Refactor: extract a `toggle_window_show` helper that always shows (used by menu items, vs `toggle_window` which toggles, used by tray click):

```rust
fn toggle_window_show(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.as_ref().window().move_window(tauri_plugin_positioner::Position::TrayCenter);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = app.emit("window-shown", ());
    }
}
```

`show_menu_on_left_click(false)` is required — without it, left-click would open the native menu instead of calling `toggle_window`, breaking Task 3's behavior. Right-click opens the context menu by default once `.menu(&menu)` is set.

- [ ] **Step 3: Verify visually**

```bash
npm run tauri dev
```

Manually check: right-click tray icon shows native menu with "Open Bancada", 4 pinned tools, separator, "Settings…", separator, "Quit Bancada"; left-click still toggles the window (unaffected); clicking "Quit Bancada" actually terminates the process (tray icon disappears).

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add -A
git commit -m "feat: tray right-click context menu with pinned tools, Settings, Quit"
```

---

### Task 6: Tool registry + fuzzy search lib + auto-generated sidebar (US-006)

**Files:**
- Create: `src/lib/tool.ts`, `src/lib/fuzzy.ts`, `src/lib/fuzzy.test.ts`
- Create: `src/tools/registry.ts`, `src/tools/_stub/index.ts`, `src/tools/_stub/StubTool.tsx` (deleted again in Task 8 once a real tool exists)
- Create: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx` (active-tool state, renders Sidebar + active tool's component, subscribes to `tray-select-tool`, persists via `setLastToolId`)

**Interfaces:**
- Produces: `Tool` interface, `tools: Tool[]`, `toolsById: Record<string, Tool>` (consumed by every later tool task and by Task 7's palette), `fuzzyMatch(query: string, target: string): boolean` and `fuzzyScore(query: string, target: string): number` (consumed by Task 7).

- [ ] **Step 1: Define the `Tool` interface**

Create `src/lib/tool.ts`:

```typescript
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type ToolCategory = "encoding" | "text" | "time" | "web" | "format";

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  icon: LucideIcon;
  keywords: string[];
  component: ComponentType;
}
```

- [ ] **Step 2: Write fuzzy matcher tests first**

Create `src/lib/fuzzy.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { fuzzyMatch, fuzzyScore } from "./fuzzy";

describe("fuzzyMatch", () => {
  it("matches when query chars appear in order", () => {
    expect(fuzzyMatch("jsn", "JSON Formatter")).toBe(true);
  });

  it("does not match when chars are out of order", () => {
    expect(fuzzyMatch("nsj", "JSON Formatter")).toBe(false);
  });

  it("matches an empty query against anything", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(fuzzyMatch("JSON", "json formatter")).toBe(true);
  });
});

describe("fuzzyScore", () => {
  it("scores a contiguous match higher than a scattered one", () => {
    const contiguous = fuzzyScore("json", "JSON Formatter");
    const scattered = fuzzyScore("jsn", "JSON Formatter");
    expect(contiguous).toBeGreaterThan(scattered);
  });

  it("scores a prefix match higher than a mid-string match", () => {
    const prefix = fuzzyScore("json", "JSON Formatter");
    const midString = fuzzyScore("form", "JSON Formatter");
    expect(prefix).toBeGreaterThan(midString);
  });

  it("returns -1 for no match", () => {
    expect(fuzzyScore("xyz", "JSON Formatter")).toBe(-1);
  });
});
```

Run: `npm run test`. Expected: FAIL with "Failed to resolve import ./fuzzy".

- [ ] **Step 3: Implement the fuzzy matcher**

Create `src/lib/fuzzy.ts`:

```typescript
export function fuzzyMatch(query: string, target: string): boolean {
  return fuzzyScore(query, target) >= 0;
}

export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;

  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      const isConsecutive = lastMatchIndex === ti - 1;
      const isPrefix = ti === 0;
      score += isConsecutive ? 5 : 1;
      if (isPrefix) score += 10;
      lastMatchIndex = ti;
      qi++;
    }
  }

  return qi === q.length ? score : -1;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test
```

Expected: all `fuzzy` tests PASS.

- [ ] **Step 5: Registry + a stub tool to prove wiring**

Create `src/tools/_stub/StubTool.tsx`:

```tsx
export function StubTool() {
  return <div className="p-4 text-sm text-muted-foreground">Stub tool — proves registry wiring.</div>;
}
```

Create `src/tools/_stub/index.ts`:

```typescript
import { Wrench } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { StubTool } from "./StubTool";

export const stubTool: Tool = {
  id: "stub",
  name: "Stub Tool",
  category: "text",
  icon: Wrench,
  keywords: ["stub", "test"],
  component: StubTool,
};
```

Create `src/tools/registry.ts`:

```typescript
import type { Tool } from "@/lib/tool";
import { stubTool } from "./_stub";

export const tools: Tool[] = [stubTool];

export const toolsById: Record<string, Tool> = Object.fromEntries(
  tools.map((t) => [t.id, t]),
);
```

- [ ] **Step 6: Sidebar generated from the registry**

Create `src/components/Sidebar.tsx`:

```tsx
import { tools, type Tool } from "@/tools/registry";
import { cn } from "@/lib/utils";

const categoryLabels: Record<Tool["category"], string> = {
  encoding: "Encoding",
  text: "Text",
  time: "Time",
  web: "Web",
  format: "Format",
};

interface SidebarProps {
  activeToolId: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ activeToolId, onSelect }: SidebarProps) {
  const byCategory = tools.reduce<Record<string, Tool[]>>((acc, tool) => {
    (acc[tool.category] ??= []).push(tool);
    return acc;
  }, {});

  return (
    <nav className="w-48 shrink-0 overflow-y-auto border-r p-2">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category} className="mb-3">
          <div className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
            {categoryLabels[category as Tool["category"]]}
          </div>
          {items.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelect(tool.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent",
                activeToolId === tool.id && "bg-accent font-medium",
              )}
            >
              <tool.icon className="h-4 w-4" />
              {tool.name}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
```

Note: `Tool` is exported as a type re-export from `registry.ts` for this import to work — add `export type { Tool } from "@/lib/tool";` to `registry.ts`.

- [ ] **Step 7: Wire App.tsx — active tool state, tray events, last-tool persistence**

Replace `src/App.tsx`:

```tsx
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Sidebar } from "@/components/Sidebar";
import { toolsById, tools } from "@/tools/registry";
import { getLastToolId, setLastToolId } from "@/lib/lastTool";

function App() {
  const [activeToolId, setActiveToolId] = useState(
    () => getLastToolId() ?? tools[0].id,
  );

  useEffect(() => {
    setLastToolId(activeToolId);
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

  const ActiveComponent = toolsById[activeToolId]?.component ?? (() => null);

  return (
    <main className="flex h-screen w-screen bg-background text-foreground">
      <Sidebar activeToolId={activeToolId} onSelect={setActiveToolId} />
      <div className="flex-1 overflow-y-auto">
        <ActiveComponent />
      </div>
    </main>
  );
}

export default App;
```

Update `src/App.test.tsx` (the old "Bancada button" smoke test no longer applies):

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the sidebar with the stub tool and shows its content", () => {
    render(<App />);
    expect(screen.getByText("Stub Tool")).toBeInTheDocument();
    expect(screen.getByText("Stub tool — proves registry wiring.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run full verification**

```bash
npm run typecheck
npm run test
npm run tauri dev
```

Expected: typecheck clean, tests pass, window shows a sidebar with one "Text" category containing "Stub Tool", clicking it shows the stub content. Right-click tray "JSON Formatter" etc. will emit events with ids that don't exist yet in `toolsById` (harmless no-op until Task 8+).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: tool registry, fuzzy search lib, sidebar generated from registry"
```

---

### Task 7: Command palette (Cmd+K) (US-007)

**Files:**
- Create: `src/components/CommandPalette.tsx`
- Modify: `src/App.tsx` (mount palette, manage open state, Cmd+K listener)

**Interfaces:**
- Consumes: `tools: Tool[]` and `fuzzyScore` from Task 6.
- Produces: nothing consumed by later tasks — this is a leaf UI feature.

- [ ] **Step 1: Build the palette component**

Create `src/components/CommandPalette.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { tools } from "@/tools/registry";
import { fuzzyScore } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (toolId: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (query.trim() === "") return tools;
    return tools
      .map((tool) => {
        const haystacks = [tool.name, ...tool.keywords];
        const best = Math.max(...haystacks.map((h) => fuzzyScore(query, h)));
        return { tool, score: best };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.tool);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const tool = results[selectedIndex];
      if (tool) {
        onSelect(tool.id);
        onClose();
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-popover shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          id="search-input"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search tools…"
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-72 overflow-y-auto p-1">
          {results.map((tool, i) => (
            <li key={tool.id}>
              <button
                onClick={() => {
                  onSelect(tool.id);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm",
                  i === selectedIndex && "bg-accent",
                )}
              >
                <tool.icon className="h-4 w-4" />
                {tool.name}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No tools match.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire Cmd+K and mount in App.tsx**

Edit `src/App.tsx`: add palette state and a global keydown listener, and render `<CommandPalette>`.

```tsx
import { CommandPalette } from "@/components/CommandPalette";

// inside App():
const [paletteOpen, setPaletteOpen] = useState(false);

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
```

Add to the returned JSX, as a sibling of `<main>`:

```tsx
<CommandPalette
  open={paletteOpen}
  onClose={() => setPaletteOpen(false)}
  onSelect={setActiveToolId}
/>
```

Note: the palette's input now owns `id="search-input"` — remove that id from anywhere else if duplicated (it wasn't used elsewhere yet, so nothing to remove).

- [ ] **Step 3: Verify visually**

```bash
npm run tauri dev
```

Manually check: `Cmd+K` opens the overlay with input focused; typing "stu" filters to "Stub Tool"; arrow keys move the highlighted row; Enter selects it and closes the palette, switching the sidebar's active tool; `Esc` closes without selecting.

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add -A
git commit -m "feat: Cmd+K command palette with fuzzy search and keyboard navigation"
```

---

### Task 8: ToolShell + clipboard helper + JSON formatter (US-008)

**Files:**
- Create: `src/lib/clipboard.ts`
- Create: `src/components/CopyButton.tsx`
- Create: `src/components/ToolShell.tsx`
- Create: `src/tools/json-formatter/{format.ts,format.test.ts,JsonFormatter.tsx,index.ts}`
- Modify: `src/tools/registry.ts` (remove `stubTool`, add `jsonFormatter`)
- Delete: `src/tools/_stub/`
- Modify: `src/App.tsx` (default active tool is now `json-formatter`, not the removed stub)

**Interfaces:**
- Produces: `copyToClipboard(text: string): Promise<void>` and `<CopyButton text={string} />` (consumed by every later tool task), `<ToolShell title input output>` layout (consumed by every later tool task).

- [ ] **Step 1: Clipboard helper**

Create `src/lib/clipboard.ts`:

```typescript
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
```

- [ ] **Step 2: CopyButton**

Create `src/components/CopyButton.tsx`:

```tsx
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={!text}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
```

- [ ] **Step 3: ToolShell layout**

Create `src/components/ToolShell.tsx`:

```tsx
import type { ReactNode } from "react";

interface ToolShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ToolShell({ title, actions, children }: ToolShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-semibold">{title}</h1>
        <div className="flex gap-2">{actions}</div>
      </header>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}

interface ToolPanesProps {
  children: ReactNode;
}

export function ToolPanes({ children }: ToolPanesProps) {
  return <div className="grid h-full grid-cols-2 gap-4">{children}</div>;
}
```

- [ ] **Step 4: Write JSON formatter pure-logic tests first**

Create `src/tools/json-formatter/format.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatJson, minifyJson } from "./format";

describe("formatJson", () => {
  it("pretty-prints valid JSON with 2-space indent", () => {
    const result = formatJson('{"a":1,"b":[1,2]}');
    expect(result).toEqual({ ok: true, value: '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}' });
  });

  it("reports an error with line/column for invalid JSON", () => {
    const result = formatJson('{"a": }');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/line \d+/i);
    }
  });
});

describe("minifyJson", () => {
  it("removes all insignificant whitespace", () => {
    const result = minifyJson('{\n  "a": 1\n}');
    expect(result).toEqual({ ok: true, value: '{"a":1}' });
  });

  it("reports the same error shape as formatJson on invalid input", () => {
    const result = minifyJson("not json");
    expect(result.ok).toBe(false);
  });
});
```

Run: `npm run test`. Expected: FAIL with "Failed to resolve import ./format".

- [ ] **Step 5: Implement `format.ts`**

Create `src/tools/json-formatter/format.ts`:

```typescript
export type JsonResult = { ok: true; value: string } | { ok: false; error: string };

function describeError(input: string, err: unknown): string {
  if (!(err instanceof SyntaxError)) return String(err);
  const positionMatch = err.message.match(/position (\d+)/);
  if (!positionMatch) return err.message;

  const position = Number(positionMatch[1]);
  const upToError = input.slice(0, position);
  const line = upToError.split("\n").length;
  const column = position - upToError.lastIndexOf("\n");
  return `${err.message} (line ${line}, column ${column})`;
}

export function formatJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, 2) };
  } catch (err) {
    return { ok: false, error: describeError(input, err) };
  }
}

export function minifyJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed) };
  } catch (err) {
    return { ok: false, error: describeError(input, err) };
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test
```

Expected: all `format.test.ts` cases PASS. (Note: V8's `JSON.parse` SyntaxError message format is `"... position N"` — if the installed Node/V8 version phrases it differently, adjust `describeError`'s regex to match the actual message, re-run, confirm green before moving on.)

- [ ] **Step 7: Build the component**

Create `src/tools/json-formatter/JsonFormatter.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { formatJson, minifyJson } from "./format";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");

  const result = useMemo(() => {
    if (input.trim() === "") return { ok: true as const, value: "" };
    return mode === "format" ? formatJson(input) : minifyJson(input);
  }, [input, mode]);

  return (
    <ToolShell
      title="JSON Formatter"
      actions={
        <>
          <Button variant={mode === "format" ? "default" : "outline"} size="sm" onClick={() => setMode("format")}>
            Format
          </Button>
          <Button variant={mode === "minify" ? "default" : "outline"} size="sm" onClick={() => setMode("minify")}>
            Minify
          </Button>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste JSON here…"
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        {result.ok ? (
          <pre className="h-full overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">{result.value}</pre>
        ) : (
          <div className="h-full overflow-auto rounded border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
            {result.error}
          </div>
        )}
      </ToolPanes>
    </ToolShell>
  );
}
```

- [ ] **Step 8: Register the tool**

Create `src/tools/json-formatter/index.ts`:

```typescript
import { Braces } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { JsonFormatter } from "./JsonFormatter";

export const jsonFormatter: Tool = {
  id: "json-formatter",
  name: "JSON Formatter",
  category: "format",
  icon: Braces,
  keywords: ["json", "format", "pretty", "minify", "validate"],
  component: JsonFormatter,
};
```

Edit `src/tools/registry.ts`:

```typescript
import type { Tool } from "@/lib/tool";
import { jsonFormatter } from "./json-formatter";

export const tools: Tool[] = [jsonFormatter];

export const toolsById: Record<string, Tool> = Object.fromEntries(
  tools.map((t) => [t.id, t]),
);

export type { Tool };
```

Delete `src/tools/_stub/` entirely:

```bash
rm -rf src/tools/_stub
```

- [ ] **Step 9: Fix App.test.tsx for the removed stub**

Edit `src/App.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the sidebar with JSON Formatter and shows its content by default", () => {
    render(<App />);
    expect(screen.getByText("JSON Formatter")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste JSON here…")).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run full verification**

```bash
npm run typecheck
npm run test
npm run tauri dev
```

Expected: typecheck clean, all tests pass, window shows JSON Formatter by default with Format/Minify/Copy controls; pasting invalid JSON shows an inline error; valid JSON pretty-prints in the right pane; Copy puts the output on the clipboard (verify with Cmd+V somewhere).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: ToolShell + clipboard helpers, JSON formatter/validator tool"
```

---

### Task 9: Base64 encode/decode (US-009)

**Files:**
- Create: `src/tools/base64/{base64.ts,base64.test.ts,Base64Tool.tsx,index.ts}`
- Modify: `src/tools/registry.ts` (add `base64Tool`)

**Interfaces:**
- Consumes: `ToolShell`, `ToolPanes`, `CopyButton` from Task 8.

- [ ] **Step 1: Write tests first**

Create `src/tools/base64/base64.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { encodeBase64, decodeBase64 } from "./base64";

describe("encodeBase64", () => {
  it("encodes ASCII text", () => {
    expect(encodeBase64("hello", false)).toEqual({ ok: true, value: "aGVsbG8=" });
  });

  it("encodes UTF-8 text correctly (not just ASCII)", () => {
    expect(encodeBase64("héllo 🚀", false)).toEqual({ ok: true, value: "aOlsbG8g8J+agA==" });
  });

  it("produces a URL-safe variant without padding or +/ characters", () => {
    const result = encodeBase64("subjects?_d>", true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toMatch(/[+/=]/);
    }
  });
});

describe("decodeBase64", () => {
  it("decodes back to the original UTF-8 text", () => {
    expect(decodeBase64("aOlsbG8g8J+agA==", false)).toEqual({ ok: true, value: "héllo 🚀" });
  });

  it("decodes the URL-safe variant", () => {
    const encoded = encodeBase64("subjects?_d>", true);
    if (!encoded.ok) throw new Error("setup failed");
    expect(decodeBase64(encoded.value, true)).toEqual({ ok: true, value: "subjects?_d>" });
  });

  it("reports an inline error for invalid base64", () => {
    const result = decodeBase64("not valid base64!!", false);
    expect(result.ok).toBe(false);
  });
});
```

Run: `npm run test`. Expected: FAIL — `./base64` doesn't exist. (If the exact byte sequence in the UTF-8 fixture above doesn't match what your engine produces, replace it with the actual output of `encodeBase64("héllo 🚀", false)` once implemented, then re-assert — the point of the test is round-trip correctness, not a specific memorized string.)

- [ ] **Step 2: Implement `base64.ts`**

Create `src/tools/base64/base64.ts`:

```typescript
export type Base64Result = { ok: true; value: string } | { ok: false; error: string };

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(b64: string): string {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return padded + "=".repeat(padLength);
}

export function encodeBase64(input: string, urlSafe: boolean): Base64Result {
  try {
    const bytes = new TextEncoder().encode(input);
    const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    const b64 = btoa(binary);
    return { ok: true, value: urlSafe ? toUrlSafe(b64) : b64 };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function decodeBase64(input: string, urlSafe: boolean): Base64Result {
  try {
    const standard = urlSafe ? fromUrlSafe(input) : input;
    const binary = atob(standard);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "Invalid base64 input" };
  }
}
```

- [ ] **Step 3: Run tests, fix the UTF-8 fixture if needed, verify green**

```bash
npm run test
```

If the literal `"aOlsbG8g8J+agA=="` fixture doesn't match (encoding differences in how the emoji's surrogate pair gets handled), run `node -e 'console.log(Buffer.from("héllo 🚀","utf-8").toString("base64"))'` to get the correct reference value, update the test, re-run until green.

- [ ] **Step 4: Build the component**

Create `src/tools/base64/Base64Tool.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, ToolPanes } from "@/components/ToolShell";
import { encodeBase64, decodeBase64 } from "./base64";

export function Base64Tool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);

  const result = useMemo(() => {
    if (input === "") return { ok: true as const, value: "" };
    return mode === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input, urlSafe);
  }, [input, mode, urlSafe]);

  return (
    <ToolShell
      title="Base64"
      actions={
        <>
          <Button variant={mode === "encode" ? "default" : "outline"} size="sm" onClick={() => setMode("encode")}>
            Encode
          </Button>
          <Button variant={mode === "decode" ? "default" : "outline"} size="sm" onClick={() => setMode("decode")}>
            Decode
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={urlSafe} onCheckedChange={setUrlSafe} />
            URL-safe
          </label>
          <CopyButton text={result.ok ? result.value : ""} />
        </>
      }
    >
      <ToolPanes>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Text to encode…" : "Base64 to decode…"}
          className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        {result.ok ? (
          <pre className="h-full overflow-auto whitespace-pre-wrap rounded border bg-muted/30 p-3 font-mono text-sm">
            {result.value}
          </pre>
        ) : (
          <div className="h-full overflow-auto rounded border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
            {result.error}
          </div>
        )}
      </ToolPanes>
    </ToolShell>
  );
}
```

This needs the shadcn `Switch` component:

```bash
npx shadcn@latest add switch
```

- [ ] **Step 5: Register the tool**

Create `src/tools/base64/index.ts`:

```typescript
import { Binary } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { Base64Tool } from "./Base64Tool";

export const base64Tool: Tool = {
  id: "base64",
  name: "Base64",
  category: "encoding",
  icon: Binary,
  keywords: ["base64", "encode", "decode"],
  component: Base64Tool,
};
```

Edit `src/tools/registry.ts`, add the import and append to the `tools` array:

```typescript
import { base64Tool } from "./base64";
// ...
export const tools: Tool[] = [jsonFormatter, base64Tool];
```

- [ ] **Step 6: Run full verification**

```bash
npm run typecheck
npm run test
npm run tauri dev
```

Expected: typecheck clean, tests pass, sidebar shows Base64 under Encoding; manually encode/decode UTF-8 text including emoji round-trips correctly; URL-safe toggle removes `+/=`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Base64 encode/decode tool with UTF-8 and URL-safe support"
```

---

### Task 10: JWT decoder (US-010)

**Files:**
- Create: `src/tools/jwt-decoder/{decode.ts,decode.test.ts,JwtDecoder.tsx,index.ts}`
- Modify: `src/tools/registry.ts`

**Interfaces:**
- Consumes: `decodeBase64` from Task 9 (base64url decoding reuses the same URL-safe logic).

- [ ] **Step 1: Write tests first**

Create `src/tools/jwt-decoder/decode.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { decodeJwt } from "./decode";

// header: {"alg":"HS256","typ":"JWT"}, payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
const SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  it("decodes header and payload", () => {
    const result = decodeJwt(SAMPLE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
      expect(result.payload).toEqual({ sub: "1234567890", name: "John Doe", iat: 1516239022 });
    }
  });

  it("flags a token with no exp as not expired", () => {
    const result = decodeJwt(SAMPLE);
    if (result.ok) {
      expect(result.expired).toBe(false);
    }
  });

  it("flags an expired token", () => {
    const header = btoa(JSON.stringify({ alg: "none" }));
    const payload = btoa(JSON.stringify({ exp: 1 })); // 1970, long expired
    const token = `${header}.${payload}.sig`;
    const result = decodeJwt(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expired).toBe(true);
    }
  });

  it("rejects a token without 3 segments", () => {
    const result = decodeJwt("not.a.jwt.token.really");
    expect(result.ok).toBe(false);
  });

  it("rejects malformed base64url segments", () => {
    const result = decodeJwt("not-base64.not-base64.sig");
    expect(result.ok).toBe(false);
  });
});
```

Run: `npm run test`. Expected: FAIL — `./decode` doesn't exist.

- [ ] **Step 2: Implement `decode.ts`**

Create `src/tools/jwt-decoder/decode.ts`:

```typescript
import { decodeBase64 } from "@/tools/base64/base64";

export type JwtResult =
  | {
      ok: true;
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      expired: boolean;
    }
  | { ok: false; error: string };

function decodeSegment(segment: string): Record<string, unknown> {
  const result = decodeBase64(segment, true);
  if (!result.ok) throw new Error(result.error);
  return JSON.parse(result.value);
}

export function decodeJwt(token: string): JwtResult {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { ok: false, error: "A JWT must have exactly 3 dot-separated segments (header.payload.signature)" };
  }

  try {
    const header = decodeSegment(parts[0]);
    const payload = decodeSegment(parts[1]);
    const exp = payload.exp;
    const expired = typeof exp === "number" ? Date.now() >= exp * 1000 : false;
    return { ok: true, header, payload, expired };
  } catch (err) {
    return { ok: false, error: `Could not decode token: ${err instanceof Error ? err.message : String(err)}` };
  }
}
```

- [ ] **Step 3: Run tests, verify green**

```bash
npm run test
```

- [ ] **Step 4: Build the component**

Create `src/tools/jwt-decoder/JwtDecoder.tsx`:

```tsx
import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { decodeJwt } from "./decode";

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;
  return new Date(value * 1000).toLocaleString();
}

export function JwtDecoder() {
  const [input, setInput] = useState("");

  const result = useMemo(() => (input.trim() === "" ? null : decodeJwt(input)), [input]);

  return (
    <ToolShell title="JWT Decoder">
      <div className="flex h-full flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a JWT…"
          className="h-24 w-full resize-none rounded border bg-muted/30 p-3 font-mono text-xs outline-none"
        />
        <p className="text-xs text-muted-foreground">
          Decoding only — signatures are not verified, no secret is required.
        </p>
        {result && !result.ok && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-3 font-mono text-sm text-destructive">
            {result.error}
          </div>
        )}
        {result && result.ok && (
          <div className="grid flex-1 grid-cols-2 gap-4 overflow-auto">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Header</h2>
              <pre className="overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">
                {JSON.stringify(result.header, null, 2)}
              </pre>
            </div>
            <div>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                Payload
                {result.expired && (
                  <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-destructive">Expired</span>
                )}
                {!result.expired && "exp" in result.payload && (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-600">Valid</span>
                )}
              </h2>
              <pre className="overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {formatTimestamp(result.payload.iat) && <div>iat: {formatTimestamp(result.payload.iat)}</div>}
                {formatTimestamp(result.payload.nbf) && <div>nbf: {formatTimestamp(result.payload.nbf)}</div>}
                {formatTimestamp(result.payload.exp) && <div>exp: {formatTimestamp(result.payload.exp)}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
```

- [ ] **Step 5: Register the tool**

Create `src/tools/jwt-decoder/index.ts`:

```typescript
import { KeyRound } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { JwtDecoder } from "./JwtDecoder";

export const jwtDecoder: Tool = {
  id: "jwt-decoder",
  name: "JWT Decoder",
  category: "encoding",
  icon: KeyRound,
  keywords: ["jwt", "token", "decode", "auth"],
  component: JwtDecoder,
};
```

Edit `src/tools/registry.ts`: import `jwtDecoder` and append to `tools`.

- [ ] **Step 6: Run full verification**

```bash
npm run typecheck
npm run test
npm run tauri dev
```

Expected: paste a real JWT, header/payload render pretty-printed, expired tokens show an "Expired" badge, `iat`/`exp`/`nbf` render as human-readable dates.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: JWT decoder tool (decode-only, expiry indicator)"
```

---

### Task 11: Timestamp converter (US-011)

**Files:**
- Create: `src/tools/timestamp/{convert.ts,convert.test.ts,TimestampConverter.tsx,index.ts}`
- Modify: `src/tools/registry.ts`

- [ ] **Step 1: Write tests first**

Create `src/tools/timestamp/convert.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseTimestamp, dateToTimestamp } from "./convert";

describe("parseTimestamp", () => {
  it("auto-detects seconds for a 10-digit input", () => {
    const result = parseTimestamp("1700000000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe(new Date(1700000000 * 1000).toISOString());
    }
  });

  it("auto-detects milliseconds for a 13-digit input", () => {
    const result = parseTimestamp("1700000000000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe(new Date(1700000000000).toISOString());
    }
  });

  it("respects an explicit unit override", () => {
    const result = parseTimestamp("1700000000000", "seconds");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe(new Date(1700000000000 * 1000).toISOString());
    }
  });

  it("rejects non-numeric input", () => {
    expect(parseTimestamp("not a number").ok).toBe(false);
  });
});

describe("dateToTimestamp", () => {
  it("converts an ISO date string to seconds and milliseconds", () => {
    const iso = "2023-11-14T22:13:20.000Z";
    const result = dateToTimestamp(iso);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seconds).toBe(1700000000);
      expect(result.milliseconds).toBe(1700000000000);
    }
  });

  it("rejects an invalid date string", () => {
    expect(dateToTimestamp("not a date").ok).toBe(false);
  });
});
```

Run: `npm run test`. Expected: FAIL — `./convert` doesn't exist.

- [ ] **Step 2: Implement `convert.ts`**

Create `src/tools/timestamp/convert.ts`:

```typescript
export type Unit = "auto" | "seconds" | "milliseconds";

export type ParseResult =
  | { ok: true; iso: string; local: string; utc: string; unitUsed: "seconds" | "milliseconds" }
  | { ok: false; error: string };

export type DateToTimestampResult =
  | { ok: true; seconds: number; milliseconds: number }
  | { ok: false; error: string };

export function parseTimestamp(input: string, unit: Unit = "auto"): ParseResult {
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: "Timestamp must be an integer (seconds or milliseconds)" };
  }

  const numeric = Number(trimmed);
  const resolvedUnit: "seconds" | "milliseconds" =
    unit === "auto" ? (Math.abs(numeric) >= 1e12 ? "milliseconds" : "seconds") : unit;

  const millis = resolvedUnit === "seconds" ? numeric * 1000 : numeric;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Resulting date is out of range" };
  }

  return {
    ok: true,
    iso: date.toISOString(),
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    unitUsed: resolvedUnit,
  };
}

export function dateToTimestamp(isoOrLocal: string): DateToTimestampResult {
  const date = new Date(isoOrLocal);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Could not parse that date" };
  }
  return { ok: true, seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime() };
}

export function nowTimestamp(): { seconds: number; milliseconds: number } {
  const ms = Date.now();
  return { seconds: Math.floor(ms / 1000), milliseconds: ms };
}
```

- [ ] **Step 3: Run tests, verify green**

```bash
npm run test
```

- [ ] **Step 4: Build the component**

Create `src/tools/timestamp/TimestampConverter.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { parseTimestamp, dateToTimestamp, nowTimestamp, type Unit } from "./convert";

export function TimestampConverter() {
  const [tsInput, setTsInput] = useState("");
  const [unit, setUnit] = useState<Unit>("auto");
  const [dateInput, setDateInput] = useState("");

  const parsed = useMemo(() => (tsInput.trim() === "" ? null : parseTimestamp(tsInput, unit)), [tsInput, unit]);
  const reversed = useMemo(() => (dateInput.trim() === "" ? null : dateToTimestamp(dateInput)), [dateInput]);

  return (
    <ToolShell title="Timestamp Converter">
      <div className="flex h-full flex-col gap-6">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase text-muted-foreground">Timestamp → Date</h2>
            <Button size="sm" variant="outline" onClick={() => setTsInput(String(nowTimestamp().seconds))}>
              Now
            </Button>
            {(["auto", "seconds", "milliseconds"] as Unit[]).map((u) => (
              <Button key={u} size="sm" variant={unit === u ? "default" : "outline"} onClick={() => setUnit(u)}>
                {u}
              </Button>
            ))}
          </div>
          <input
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            placeholder="e.g. 1700000000 or 1700000000000"
            className="w-full rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
          />
          {parsed && !parsed.ok && <p className="mt-2 text-sm text-destructive">{parsed.error}</p>}
          {parsed && parsed.ok && (
            <div className="mt-3 space-y-1 font-mono text-sm">
              <div className="flex items-center gap-2">Local: {parsed.local} <CopyButton text={parsed.local} /></div>
              <div className="flex items-center gap-2">UTC: {parsed.utc} <CopyButton text={parsed.utc} /></div>
              <div className="flex items-center gap-2">ISO 8601: {parsed.iso} <CopyButton text={parsed.iso} /></div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Date → Timestamp</h2>
          <input
            type="datetime-local"
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
          />
          {reversed && !reversed.ok && <p className="mt-2 text-sm text-destructive">{reversed.error}</p>}
          {reversed && reversed.ok && (
            <div className="mt-3 space-y-1 font-mono text-sm">
              <div className="flex items-center gap-2">
                Seconds: {reversed.seconds} <CopyButton text={String(reversed.seconds)} />
              </div>
              <div className="flex items-center gap-2">
                Milliseconds: {reversed.milliseconds} <CopyButton text={String(reversed.milliseconds)} />
              </div>
            </div>
          )}
        </section>
      </div>
    </ToolShell>
  );
}
```

- [ ] **Step 5: Register the tool**

Create `src/tools/timestamp/index.ts`:

```typescript
import { Clock } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { TimestampConverter } from "./TimestampConverter";

export const timestampConverter: Tool = {
  id: "timestamp",
  name: "Timestamp Converter",
  category: "time",
  icon: Clock,
  keywords: ["timestamp", "unix", "epoch", "date", "time"],
  component: TimestampConverter,
};
```

Edit `src/tools/registry.ts`: import `timestampConverter` and append to `tools`.

- [ ] **Step 6: Run full verification + commit**

```bash
npm run typecheck
npm run test
npm run tauri dev
git add -A
git commit -m "feat: timestamp <-> date converter tool"
```

---

### Task 12: Regex tester (US-012)

**Files:**
- Create: `src/tools/regex-tester/{match.ts,match.test.ts,RegexTester.tsx,index.ts}`
- Modify: `src/tools/registry.ts`

- [ ] **Step 1: Write tests first**

Create `src/tools/regex-tester/match.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { findMatches } from "./match";

describe("findMatches", () => {
  it("returns matches with index, text, and capture groups", () => {
    const result = findMatches("\\d+", "g", "a1 b22 c333");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches.map((m) => m.text)).toEqual(["1", "22", "333"]);
      expect(result.matches[0].index).toBe(1);
    }
  });

  it("captures named and positional groups", () => {
    const result = findMatches("(?<word>[a-z]+)(\\d+)", "g", "ab12");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches[0].groups).toEqual(["ab", "12"]);
      expect(result.matches[0].namedGroups).toEqual({ word: "ab" });
    }
  });

  it("returns an inline error for an invalid pattern", () => {
    const result = findMatches("(unclosed", "g", "text");
    expect(result.ok).toBe(false);
  });

  it("returns an inline error for invalid flags", () => {
    const result = findMatches("abc", "z", "text");
    expect(result.ok).toBe(false);
  });

  it("returns no matches without throwing when the pattern is empty", () => {
    const result = findMatches("", "g", "text");
    expect(result.ok).toBe(true);
  });
});
```

Run: `npm run test`. Expected: FAIL — `./match` doesn't exist.

- [ ] **Step 2: Implement `match.ts`**

Create `src/tools/regex-tester/match.ts`:

```typescript
export interface MatchInfo {
  text: string;
  index: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string>;
}

export type MatchResult = { ok: true; matches: MatchInfo[] } | { ok: false; error: string };

export function findMatches(pattern: string, flags: string, testString: string): MatchResult {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const matches: MatchInfo[] = [];
  let match: RegExpExecArray | null;
  let iterations = 0;
  while ((match = regex.exec(testString)) !== null && iterations < 10000) {
    matches.push({
      text: match[0],
      index: match.index,
      groups: match.slice(1),
      namedGroups: { ...match.groups },
    });
    if (match[0].length === 0) regex.lastIndex++;
    iterations++;
  }

  return { ok: true, matches };
}
```

- [ ] **Step 3: Run tests, verify green**

```bash
npm run test
```

- [ ] **Step 4: Build the component**

Create `src/tools/regex-tester/RegexTester.tsx`:

```tsx
import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ToolShell";
import { findMatches } from "./match";

const FLAG_OPTIONS = ["g", "i", "m", "s", "u"] as const;

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [testString, setTestString] = useState("");

  const result = useMemo(
    () => (pattern === "" ? { ok: true as const, matches: [] } : findMatches(pattern, flags.join(""), testString)),
    [pattern, flags, testString],
  );

  function toggleFlag(flag: string) {
    setFlags((current) => (current.includes(flag) ? current.filter((f) => f !== flag) : [...current, flag]));
  }

  const highlighted = useMemo(() => {
    if (!result.ok || result.matches.length === 0) return testString;
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    result.matches.forEach((m, i) => {
      parts.push(testString.slice(cursor, m.index));
      parts.push(
        <mark key={i} className="rounded bg-yellow-300/60 px-0.5">
          {m.text}
        </mark>,
      );
      cursor = m.index + m.text.length;
    });
    parts.push(testString.slice(cursor));
    return parts;
  }, [result, testString]);

  return (
    <ToolShell title="Regex Tester">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            className="flex-1 rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
          />
          <span className="font-mono text-sm">/</span>
          {FLAG_OPTIONS.map((flag) => (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              className={`rounded px-2 py-1 font-mono text-xs ${flags.includes(flag) ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {flag}
            </button>
          ))}
        </div>
        {!result.ok && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {result.error}
          </div>
        )}
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Test string…"
          className="h-32 w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <div className="flex-1 overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap">
          {highlighted}
        </div>
        {result.ok && result.matches.length > 0 && (
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Capture groups (match 1 of {result.matches.length})
            </h2>
            <pre className="overflow-auto rounded border bg-muted/30 p-2 text-xs">
              {JSON.stringify({ groups: result.matches[0].groups, named: result.matches[0].namedGroups }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
```

- [ ] **Step 5: Register the tool**

Create `src/tools/regex-tester/index.ts`:

```typescript
import { Regex } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { RegexTester } from "./RegexTester";

export const regexTester: Tool = {
  id: "regex-tester",
  name: "Regex Tester",
  category: "text",
  icon: Regex,
  keywords: ["regex", "regexp", "pattern", "match"],
  component: RegexTester,
};
```

Edit `src/tools/registry.ts`: import `regexTester` and append to `tools`.

- [ ] **Step 6: Run full verification + commit**

```bash
npm run typecheck
npm run test
npm run tauri dev
git add -A
git commit -m "feat: regex tester with live highlighting and capture groups"
```

---

### Task 13: Text diff (US-013)

**Files:**
- Modify: `package.json` (add `diff` + `@types/diff` — small, dependency-free line-diff library, no network at runtime)
- Create: `src/tools/text-diff/{TextDiff.tsx,index.ts}`
- Modify: `src/tools/registry.ts`

**Interfaces:**
- Decision: use the `diff` npm package's `diffLines` for line-level diffing rather than hand-rolling Myers diff — it's a pure, zero-dependency library, consistent with "most tools are pure TypeScript."

- [ ] **Step 1: Install the diff library**

```bash
npm install diff
npm install -D @types/diff
```

- [ ] **Step 2: Build the component (logic is a thin wrapper around `diffLines`, tested through the component rather than a separate pure-fn module since `diffLines` itself is already tested upstream)**

Create `src/tools/text-diff/TextDiff.tsx`:

```tsx
import { useMemo, useState } from "react";
import { diffLines } from "diff";
import { Switch } from "@/components/ui/switch";
import { ToolShell } from "@/components/ToolShell";

export function TextDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const changes = useMemo(
    () => diffLines(left, right, { ignoreWhitespace }),
    [left, right, ignoreWhitespace],
  );

  return (
    <ToolShell
      title="Text Diff"
      actions={
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={ignoreWhitespace} onCheckedChange={setIgnoreWhitespace} />
          Ignore whitespace
        </label>
      }
    >
      <div className="flex h-full flex-col gap-4">
        <div className="grid h-40 grid-cols-2 gap-4">
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Original text…"
            className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
          />
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Changed text…"
            className="h-full w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
          />
        </div>
        <div className="flex-1 overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm">
          {changes.map((part, i) => (
            <div
              key={i}
              className={
                part.added
                  ? "bg-emerald-500/20 text-emerald-700"
                  : part.removed
                    ? "bg-red-500/20 text-red-700"
                    : ""
              }
            >
              {part.value.split("\n").filter((_, idx, arr) => idx < arr.length - 1 || arr.length === 1).map((line, j) => (
                <div key={j}>
                  {part.added ? "+ " : part.removed ? "- " : "  "}
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
```

- [ ] **Step 3: Register the tool**

Create `src/tools/text-diff/index.ts`:

```typescript
import { GitCompare } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { TextDiff } from "./TextDiff";

export const textDiff: Tool = {
  id: "text-diff",
  name: "Text Diff",
  category: "text",
  icon: GitCompare,
  keywords: ["diff", "compare", "text", "changes"],
  component: TextDiff,
};
```

Edit `src/tools/registry.ts`: import `textDiff` and append to `tools`.

- [ ] **Step 4: Verify visually**

```bash
npm run typecheck
npm run tauri dev
```

Manually check: type differing text on both sides, added lines highlight green with `+`, removed lines highlight red with `-`, unchanged lines plain; toggling "Ignore whitespace" collapses whitespace-only diffs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: text diff tool with line-level highlighting and ignore-whitespace toggle"
```

---

### Task 14: Color converter (US-014)

**Files:**
- Create: `src/tools/color-converter/{convert.ts,convert.test.ts,ColorConverter.tsx,index.ts}`
- Modify: `src/tools/registry.ts`

- [ ] **Step 1: Write tests first**

Create `src/tools/color-converter/convert.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseColor } from "./convert";

describe("parseColor", () => {
  it("parses HEX and derives RGB and HSL", () => {
    const result = parseColor("#ff0000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hex).toBe("#ff0000");
      expect(result.rgb).toBe("rgb(255, 0, 0)");
      expect(result.hsl).toBe("hsl(0, 100%, 50%)");
    }
  });

  it("parses shorthand 3-digit HEX", () => {
    const result = parseColor("#f00");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.hex).toBe("#ff0000");
  });

  it("parses RGB and derives HEX and HSL", () => {
    const result = parseColor("rgb(0, 255, 0)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hex).toBe("#00ff00");
      expect(result.hsl).toBe("hsl(120, 100%, 50%)");
    }
  });

  it("parses HSL and derives HEX and RGB", () => {
    const result = parseColor("hsl(240, 100%, 50%)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hex).toBe("#0000ff");
      expect(result.rgb).toBe("rgb(0, 0, 255)");
    }
  });

  it("rejects an unrecognized format", () => {
    expect(parseColor("not a color").ok).toBe(false);
  });
});
```

Run: `npm run test`. Expected: FAIL — `./convert` doesn't exist.

- [ ] **Step 2: Implement `convert.ts`**

Create `src/tools/color-converter/convert.ts`:

```typescript
export type ColorResult = { ok: true; hex: string; rgb: string; hsl: string } | { ok: false; error: string };

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let [r, g, b] = [0, 0, 0];

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function buildResult(r: number, g: number, b: number): ColorResult {
  const [h, s, l] = rgbToHsl(r, g, b);
  return {
    ok: true,
    hex: rgbToHex(r, g, b),
    rgb: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  };
}

export function parseColor(input: string): ColorResult {
  const trimmed = input.trim();

  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return buildResult(r, g, b);
  }

  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1, 4).map(Number);
    return buildResult(r, g, b);
  }

  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (hslMatch) {
    const [h, s, l] = hslMatch.slice(1, 4).map(Number);
    const [r, g, b] = hslToRgb(h, s, l);
    return buildResult(r, g, b);
  }

  return { ok: false, error: "Unrecognized color format — use HEX (#rrggbb), rgb(r, g, b), or hsl(h, s%, l%)" };
}
```

- [ ] **Step 3: Run tests, verify green**

```bash
npm run test
```

- [ ] **Step 4: Build the component**

Create `src/tools/color-converter/ColorConverter.tsx`:

```tsx
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { parseColor } from "./convert";

export function ColorConverter() {
  const [input, setInput] = useState("#3b82f6");

  const result = useMemo(() => parseColor(input), [input]);

  return (
    <ToolShell title="Color Converter">
      <div className="flex h-full flex-col gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="#rrggbb, rgb(r, g, b), or hsl(h, s%, l%)"
          className="w-full rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
        />
        {!result.ok && <p className="text-sm text-destructive">{result.error}</p>}
        {result.ok && (
          <div className="flex items-center gap-6">
            <div
              className="h-24 w-24 rounded border"
              style={{ backgroundColor: result.hex }}
              aria-label="color preview"
            />
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-2">{result.hex} <CopyButton text={result.hex} /></div>
              <div className="flex items-center gap-2">{result.rgb} <CopyButton text={result.rgb} /></div>
              <div className="flex items-center gap-2">{result.hsl} <CopyButton text={result.hsl} /></div>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
```

- [ ] **Step 5: Register the tool**

Create `src/tools/color-converter/index.ts`:

```typescript
import { Palette } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { ColorConverter } from "./ColorConverter";

export const colorConverter: Tool = {
  id: "color-converter",
  name: "Color Converter",
  category: "web",
  icon: Palette,
  keywords: ["color", "hex", "rgb", "hsl"],
  component: ColorConverter,
};
```

Edit `src/tools/registry.ts`: import `colorConverter` and append to `tools`.

- [ ] **Step 6: Run full verification + commit**

```bash
npm run typecheck
npm run test
npm run tauri dev
git add -A
git commit -m "feat: color converter tool (HEX/RGB/HSL, live preview)"
```

---

### Task 15: Hash generator — MD5/SHA-1/SHA-256 (US-015)

**Files:**
- Modify: `src-tauri/Cargo.toml` (add `md-5 = "0.10"`)
- Modify: `src-tauri/src/lib.rs` (add `md5_hash` command + `#[cfg(test)]` unit test)
- Create: `src/tools/hash-generator/{hash.ts,hash.test.ts,HashGenerator.tsx,index.ts}`
- Modify: `src/tools/registry.ts`

**Interfaces:**
- Decision (resolves the PRD's open question): MD5 runs as a Rust command via `invoke("md5_hash", { input })` because no built-in Web Crypto MD5 exists; SHA-1/SHA-256 use `crypto.subtle.digest`, which is built into the webview and needs no native code.

- [ ] **Step 1: Add the Rust command**

Edit `src-tauri/Cargo.toml`, add under `[dependencies]`:

```toml
md-5 = "0.10"
```

Edit `src-tauri/src/lib.rs`, add the command and register it:

```rust
use md5::{Md5, Digest};

#[tauri::command]
fn md5_hash(input: String) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn md5_of_known_string() {
        assert_eq!(md5_hash("hello".to_string()), "5d41402abc4b2a76b9719d911017c592");
    }

    #[test]
    fn md5_of_empty_string() {
        assert_eq!(md5_hash("".to_string()), "d41d8cd98f00b204e9800998ecf8427e");
    }
}
```

Register it in the `tauri::Builder` chain (find the existing `.run(...)` call and add before it):

```rust
.invoke_handler(tauri::generate_handler![md5_hash])
```

- [ ] **Step 2: Run the Rust test**

```bash
cd src-tauri && cargo test && cd ..
```

Expected: both `md5_of_known_string` and `md5_of_empty_string` PASS.

- [ ] **Step 3: Write the frontend test for SHA hashing first**

Create `src/tools/hash-generator/hash.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sha1Hex, sha256Hex } from "./hash";

describe("sha256Hex", () => {
  it("matches the known SHA-256 of 'hello'", async () => {
    const result = await sha256Hex("hello");
    expect(result).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});

describe("sha1Hex", () => {
  it("matches the known SHA-1 of 'hello'", async () => {
    const result = await sha1Hex("hello");
    expect(result).toBe("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
  });
});
```

Run: `npm run test`. Expected: FAIL — `./hash` doesn't exist. (`jsdom`'s `crypto.subtle` is available in modern Node/Vitest; if `crypto.subtle` is undefined in the test environment, add `import { webcrypto } from "node:crypto"; globalThis.crypto ??= webcrypto as Crypto;` at the top of `hash.test.ts` and re-run.)

- [ ] **Step 4: Implement `hash.ts`**

Create `src/tools/hash-generator/hash.ts`:

```typescript
import { invoke } from "@tauri-apps/api/core";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function digestHex(algorithm: "SHA-1" | "SHA-256", input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return toHex(hashBuffer);
}

export function sha1Hex(input: string): Promise<string> {
  return digestHex("SHA-1", input);
}

export function sha256Hex(input: string): Promise<string> {
  return digestHex("SHA-256", input);
}

export function md5Hex(input: string): Promise<string> {
  return invoke<string>("md5_hash", { input });
}
```

- [ ] **Step 5: Run tests, verify green**

```bash
npm run test
```

- [ ] **Step 6: Build the component**

Create `src/tools/hash-generator/HashGenerator.tsx`:

```tsx
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ToolShell";
import { md5Hex, sha1Hex, sha256Hex } from "./hash";

export function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState({ md5: "", sha1: "", sha256: "" });

  useEffect(() => {
    if (input === "") {
      setHashes({ md5: "", sha1: "", sha256: "" });
      return;
    }
    let cancelled = false;
    Promise.all([md5Hex(input), sha1Hex(input), sha256Hex(input)]).then(([md5, sha1, sha256]) => {
      if (!cancelled) setHashes({ md5, sha1, sha256 });
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  return (
    <ToolShell title="Hash Generator">
      <div className="flex h-full flex-col gap-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Text to hash…"
          className="h-32 w-full resize-none rounded border bg-muted/30 p-3 font-mono text-sm outline-none"
        />
        <div className="space-y-2 font-mono text-sm">
          {(["md5", "sha1", "sha256"] as const).map((algo) => (
            <div key={algo} className="flex items-center gap-2">
              <span className="w-16 shrink-0 uppercase text-muted-foreground">{algo}</span>
              <span className="flex-1 truncate">{hashes[algo]}</span>
              <CopyButton text={hashes[algo]} />
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
```

- [ ] **Step 7: Register the tool**

Create `src/tools/hash-generator/index.ts`:

```typescript
import { Hash } from "lucide-react";
import type { Tool } from "@/lib/tool";
import { HashGenerator } from "./HashGenerator";

export const hashGenerator: Tool = {
  id: "hash-generator",
  name: "Hash Generator",
  category: "encoding",
  icon: Hash,
  keywords: ["hash", "md5", "sha1", "sha256", "checksum"],
  component: HashGenerator,
};
```

Edit `src/tools/registry.ts`: import `hashGenerator` and append to `tools`.

- [ ] **Step 8: Run full verification + commit**

```bash
npm run typecheck
npm run test
cd src-tauri && cargo test && cd ..
npm run tauri dev
git add -A
git commit -m "feat: hash generator (MD5 via Rust command, SHA-1/SHA-256 via Web Crypto)"
```

---

### Task 16: Settings — shortcut, theme, pinned tools, launch-at-login + persistence (US-016)

**Files:**
- Modify: `src-tauri/Cargo.toml`, `package.json` (add `tauri-plugin-store`, `tauri-plugin-autostart`)
- Modify: `src-tauri/src/lib.rs` (manage the `TrayIcon` as state, add `set_global_shortcut` + `rebuild_tray_menu` commands, init autostart plugin)
- Create: `src/store/settings.ts`, `src/lib/theme.ts`
- Create: `src/components/Settings.tsx`
- Modify: `src/App.tsx` (bootstrap: load settings, apply theme, reconcile shortcut/tray menu; route `activeToolId === "settings"` to `<Settings>`)

**Interfaces:**
- Produces: `Settings` type, `loadSettings()`, `saveSettings()`, `DEFAULT_SETTINGS` (used only by `Settings.tsx` and `App.tsx`'s bootstrap — no tool depends on this).

- [ ] **Step 1: Add the store and autostart plugins**

```bash
npm run tauri add store
npm run tauri add autostart
```

Edit `src-tauri/src/lib.rs` where `tauri_plugin_autostart::init` was added by the CLI — make sure it passes `MacosLauncher::LaunchAgent`:

```rust
.plugin(tauri_plugin_autostart::init(
    tauri_plugin_autostart::MacosLauncher::LaunchAgent,
    None,
))
```

- [ ] **Step 2: Manage the tray as app state so commands can rebuild its menu**

Edit `src-tauri/src/lib.rs`. Where the tray is built in `.setup`, capture it and call `app.manage(...)`:

```rust
let tray = TrayIconBuilder::new()
    // ...same .icon/.icon_as_template/.menu/.on_menu_event/.on_tray_icon_event as before...
    .build(app)?;
app.manage(tray);
```

- [ ] **Step 3: Add `set_global_shortcut` command**

Edit `src-tauri/src/lib.rs`:

```rust
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[tauri::command]
fn set_global_shortcut(app: tauri::AppHandle, old: Option<String>, new: String) -> Result<(), String> {
    if let Some(old_shortcut) = old {
        let _ = app.global_shortcut().unregister(old_shortcut.as_str());
    }
    app.global_shortcut().register(new.as_str()).map_err(|e| e.to_string())
}
```

- [ ] **Step 4: Add `rebuild_tray_menu` command**

```rust
use tauri::menu::IsMenuItem;

#[tauri::command]
fn rebuild_tray_menu(app: tauri::AppHandle, pinned: Vec<(String, String)>) -> Result<(), String> {
    let open_item = MenuItemBuilder::with_id("open", "Open Bancada").build(&app).map_err(|e| e.to_string())?;
    let tool_items: Vec<_> = pinned
        .iter()
        .map(|(id, label)| MenuItemBuilder::with_id(format!("tool:{id}"), label.clone()).build(&app))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    let sep1 = PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;
    let settings_item = MenuItemBuilder::with_id("settings", "Settings…").build(&app).map_err(|e| e.to_string())?;
    let sep2 = PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;
    // No keyboard accelerator (spec amendment, Task 5 Step 3): tray menu is
    // the only quit path, so Cmd+Q must not be bound to it.
    let quit_item = MenuItemBuilder::with_id("quit", "Quit Bancada")
        .build(&app)
        .map_err(|e| e.to_string())?;

    let mut refs: Vec<&dyn IsMenuItem<tauri::Wry>> = vec![&open_item];
    for item in &tool_items {
        refs.push(item);
    }
    refs.push(&sep1);
    refs.push(&settings_item);
    refs.push(&sep2);
    refs.push(&quit_item);

    let menu = MenuBuilder::new(&app).items(&refs).build().map_err(|e| e.to_string())?;
    let tray = app.state::<tauri::tray::TrayIcon>();
    tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    Ok(())
}
```

Register both new commands alongside `md5_hash`:

```rust
.invoke_handler(tauri::generate_handler![md5_hash, set_global_shortcut, rebuild_tray_menu])
```

- [ ] **Step 5: Run `cargo check` to catch any Rust mistakes early**

```bash
cd src-tauri && cargo check && cd ..
```

Fix any borrow/lifetime errors before moving on — this is the most failure-prone Rust block in the plan (mixing owned `MenuItem`s and `PredefinedMenuItem`s as `&dyn IsMenuItem` references).

- [ ] **Step 6: Settings persistence wrapper**

Create `src/store/settings.ts`:

```typescript
import { load, type Store } from "@tauri-apps/plugin-store";

export type Theme = "system" | "light" | "dark";

export interface Settings {
  theme: Theme;
  shortcut: string;
  pinnedTools: string[];
  launchAtLogin: boolean;
}

export const DEFAULT_SHORTCUT = "CmdOrCtrl+Shift+Space";

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  shortcut: DEFAULT_SHORTCUT,
  pinnedTools: ["json-formatter", "base64", "jwt-decoder", "timestamp"],
  launchAtLogin: false,
};

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  storePromise ??= load("settings.json", { autoSave: true });
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
```

- [ ] **Step 7: Theme application helper**

Create `src/lib/theme.ts`:

```typescript
import type { Theme } from "@/store/settings";

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const resolved = theme === "system" ? systemPrefersDark() : theme === "dark";
  root.classList.toggle("dark", resolved);
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function watchSystemTheme(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
```

This requires Tailwind v4's class-based dark variant. Check `src/index.css` already has (shadcn's `init` adds this for v4 by default):

```css
@custom-variant dark (&:where(.dark, .dark *));
```

If it's missing, add that line to `src/index.css` right after the `@import "tailwindcss";` line.

- [ ] **Step 8: Settings component**

```bash
npx shadcn@latest add select checkbox
```

Create `src/components/Settings.tsx`:

```tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { enable as enableAutostart, disable as disableAutostart, isEnabled as isAutostartEnabled } from "@tauri-apps/plugin-autostart";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToolShell } from "@/components/ToolShell";
import { tools } from "@/tools/registry";
import { DEFAULT_SETTINGS, DEFAULT_SHORTCUT, loadSettings, saveSettings, type Settings as SettingsType, type Theme } from "@/store/settings";
import { applyTheme } from "@/lib/theme";

const MAX_PINNED = 6;

export function Settings() {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [shortcutDraft, setShortcutDraft] = useState(DEFAULT_SETTINGS.shortcut);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    loadSettings().then(async (loaded) => {
      setSettings(loaded);
      setShortcutDraft(loaded.shortcut);
      const autostartEnabled = await isAutostartEnabled();
      setSettings((s) => ({ ...s, launchAtLogin: autostartEnabled }));
    });
  }, []);

  async function persistAndApply(next: SettingsType) {
    setSettings(next);
    await saveSettings(next);
  }

  async function handleThemeChange(theme: Theme) {
    applyTheme(theme);
    await persistAndApply({ ...settings, theme });
  }

  async function handleShortcutSave() {
    await invoke("set_global_shortcut", { old: settings.shortcut, new: shortcutDraft });
    await persistAndApply({ ...settings, shortcut: shortcutDraft });
    setSavedAt(Date.now());
  }

  async function handleTogglePinned(toolId: string) {
    const isPinned = settings.pinnedTools.includes(toolId);
    const nextPinned = isPinned
      ? settings.pinnedTools.filter((id) => id !== toolId)
      : settings.pinnedTools.length < MAX_PINNED
        ? [...settings.pinnedTools, toolId]
        : settings.pinnedTools;
    const next = { ...settings, pinnedTools: nextPinned };
    await persistAndApply(next);
    await invoke("rebuild_tray_menu", {
      pinned: nextPinned.map((id) => [id, tools.find((t) => t.id === id)?.name ?? id]),
    });
  }

  async function handleLaunchAtLoginChange(enabled: boolean) {
    if (enabled) await enableAutostart();
    else await disableAutostart();
    await persistAndApply({ ...settings, launchAtLogin: enabled });
  }

  return (
    <ToolShell title="Settings">
      <div className="flex h-full flex-col gap-6">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Theme</h2>
          <div className="flex gap-2">
            {(["system", "light", "dark"] as Theme[]).map((theme) => (
              <Button
                key={theme}
                size="sm"
                variant={settings.theme === theme ? "default" : "outline"}
                onClick={() => handleThemeChange(theme)}
              >
                {theme}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Global shortcut</h2>
          <div className="flex items-center gap-2">
            <input
              value={shortcutDraft}
              onChange={(e) => setShortcutDraft(e.target.value)}
              placeholder={DEFAULT_SHORTCUT}
              className="w-64 rounded border bg-muted/30 p-2 font-mono text-sm outline-none"
            />
            <Button size="sm" onClick={handleShortcutSave}>Save</Button>
            {savedAt && <span className="text-xs text-muted-foreground">Saved</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Format: CmdOrCtrl+Shift+Space, CmdOrCtrl+Alt+J, etc.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Pinned tools (tray menu) — up to {MAX_PINNED}
          </h2>
          <div className="grid grid-cols-2 gap-1">
            {tools.map((tool) => (
              <label key={tool.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.pinnedTools.includes(tool.id)}
                  onChange={() => handleTogglePinned(tool.id)}
                />
                {tool.name}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Launch at login</h2>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={settings.launchAtLogin} onCheckedChange={handleLaunchAtLoginChange} />
            Start Bancada automatically when you log in
          </label>
        </section>
      </div>
    </ToolShell>
  );
}
```

- [ ] **Step 9: Bootstrap settings in App.tsx**

Edit `src/App.tsx`: add an effect that runs once on mount, after the existing effects:

```tsx
import { invoke } from "@tauri-apps/api/core";
import { Settings } from "@/components/Settings";
import { loadSettings, DEFAULT_SHORTCUT } from "@/store/settings";
import { applyTheme } from "@/lib/theme";

// inside App(), new effect:
useEffect(() => {
  loadSettings().then((settings) => {
    applyTheme(settings.theme);
    if (settings.shortcut !== DEFAULT_SHORTCUT) {
      invoke("set_global_shortcut", { old: DEFAULT_SHORTCUT, new: settings.shortcut });
    }
    invoke("rebuild_tray_menu", {
      pinned: settings.pinnedTools.map((id) => [id, toolsById[id]?.name ?? id]),
    });
  });
}, []);
```

Change the active-component resolution line to route to Settings:

```tsx
const ActiveComponent =
  activeToolId === "settings" ? Settings : toolsById[activeToolId]?.component ?? (() => null);
```

- [ ] **Step 10: Run full verification**

```bash
npm run typecheck
npm run test
cd src-tauri && cargo check && cd ..
npm run tauri dev
```

Manually check, in order: open Settings from the tray menu; switch theme to "dark" and back, window restyles immediately; change the shortcut to e.g. `CmdOrCtrl+Alt+J`, click Save, then use the NEW shortcut from another app to confirm it toggles the window and the OLD one no longer does; toggle a pinned tool checkbox, right-click the tray to confirm the menu updated; toggle "Launch at login" on, check System Settings → General → Login Items to confirm Bancada was added, toggle off to confirm removal. Quit and relaunch the app (`npm run tauri dev` again) — confirm theme, shortcut, and pinned tools all restored from disk.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: settings (shortcut, theme, pinned tools, launch-at-login) with disk persistence"
```

---

### Task 17: Polish pass + universal build + success-metrics verification

**Files:**
- Modify: visual/style tweaks across `src/components/*`, `src/tools/*/*.tsx` as needed (no new architecture — Tailwind class adjustments only)
- Modify: `src-tauri/tauri.conf.json` (bundle identifier, version, icon set) if not already finalized
- No new source files expected

**Interfaces:** none — this task consumes everything built in Tasks 1-16 and produces the release artifact.

- [ ] **Step 1: Resolve the missing design brief**

`claude-design-prompt.md` does not exist in this repo. Before doing visual polish, ask the user for it. If they don't have one, treat the PRD's "Design Considerations" section as the brief: popover-style window, vibrancy/translucency background, SF-style typography, subtle native macOS feel, light/dark following system theme (already wired in Task 16).

- [ ] **Step 2: Vibrancy/translucency check**

`transparent: true` was set in Task 3's `tauri.conf.json`. Verify the window actually shows a frosted/vibrancy background rather than a flat transparent (potentially see-through-to-desktop) window — on macOS this typically needs a vibrancy effect applied via `window-vibrancy` crate since Tauri's `transparent` flag alone gives plain transparency, not blur. If the window looks like a flat semi-transparent rectangle instead of a frosted pane:

```bash
cd src-tauri && cargo add window-vibrancy && cd ..
```

Edit `src-tauri/src/lib.rs`, after the window is shown for the first time (in `toggle_window_show`/`toggle_window`, or once in `.setup` right after getting the window handle):

```rust
#[cfg(target_os = "macos")]
{
    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
    if let Some(window) = app.get_webview_window("main") {
        let _ = apply_vibrancy(&window, NSVisualEffectMaterial::Popover, None, Some(12.0));
    }
}
```

Run `npm run tauri dev`, confirm the window now shows a frosted popover background in both light and dark menu bars.

- [ ] **Step 3: Light/dark menu bar tray icon check**

Switch macOS appearance (System Settings → Appearance) between Light and Dark. Confirm the tray icon inverts correctly (it's a template image from Task 2, so this should already work) — if it doesn't, regenerate `icons/tray-icon.png` ensuring it's pure black shapes on a transparent background with no embedded color profile tricks.

- [ ] **Step 4: Full regression pass against every PRD acceptance criterion**

Re-read `tasks/prd-bancada-toolbox.md` US-001 through US-016 top to bottom. For each unchecked `- [ ]` acceptance criterion, manually verify it now holds against the running dev build and check it off in the PRD file itself.

- [ ] **Step 5: Typecheck, lint, full test suite, Rust checks**

```bash
npm run typecheck
npm run lint
npm run test
cd src-tauri && cargo check && cargo test && cd ..
```

All must pass clean.

- [ ] **Step 6: Universal release build + size check**

```bash
npm run tauri build -- --target universal-apple-darwin
du -sh src-tauri/target/universal-apple-darwin/release/bundle/macos/Bancada.app
```

Expected: `.app` under 15 MB (success metric). If it's over, check whether `cargo build --release` stripped debug symbols (`strip = true` and `lto = true` under `[profile.release]` in `src-tauri/Cargo.toml` reduce size substantially — add them if missing, rebuild, re-measure).

- [ ] **Step 7: Cold start timing check**

Launch the built `.app` directly (not via `tauri dev`), trigger the global shortcut, and informally time tray-click-to-visible-window (stopwatch/screen recording is fine — this is a manual spot-check, not an automated benchmark). Expected: under 300ms, no perceptible lag. If it's slow, check whether anything in `App.tsx`'s mount effects (settings load, tray menu rebuild) is blocking the first paint — those `invoke`/`loadSettings` calls should already be fire-and-forget `useEffect`s that don't block render, but confirm.

- [ ] **Step 8: Zero-network-requests spot check**

Open the WebView devtools (right-click in the window → Inspect, available in debug builds) and watch the Network tab while exercising all 8 tools plus Settings. Expected: zero requests of any kind.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "polish: vibrancy background, final PRD acceptance pass, universal release build"
```

---

## Self-Review Notes (for whoever executes this plan)

- **Spec coverage:** every US-001 through US-016 maps to exactly one task (Tasks 1-16); FR-1 through FR-12 are each covered (registry → Task 6, Cmd+K → Task 7, offline-only → no tool ever imports a network client, persistence → Task 16, universal build → Tasks 1 & 17). Non-goals (Windows/Linux, backend, telemetry, JWT signature verification, file tools, plugin marketplace, multi-window) are deliberately absent from every task above.
- **Known risk spots flagged inline:** the Rust `rebuild_tray_menu` command's mixed `&dyn IsMenuItem` lifetime juggling (Task 16, Step 5 has an explicit `cargo check` checkpoint for this), and the vibrancy-vs-plain-transparency distinction (Task 17, Step 2).
- **Open decision already resolved during planning (was an open question in the PRD):** MD5 via Rust command, SHA-1/SHA-256 via Web Crypto (Task 15) — no further decision needed at execution time.
- **Still genuinely open:** the design brief file referenced by CLAUDE.md doesn't exist (Task 17, Step 1) — flag to the user before polishing rather than guessing at a visual direction.
- **Incident log:** Task 1's first execution attempt ran `npm create tauri-app -- --force` directly in this non-empty, zero-commit repo, which deleted `CLAUDE.md`, `tasks/`, and `docs/`. Task 1 now has an explicit Step 0 (commit pre-existing files first) and Step 1 (scaffold in `/tmp`, copy in, verify `git status` shows no deletions before committing) to prevent recurrence. This is also now a Global Constraint.
