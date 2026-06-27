# PRD: Bancada — Dev Toolbox (macOS menu bar app)

## Introduction

Bancada is a native macOS menu bar utility that bundles the small text/data tools
a developer reaches for many times a day (JSON formatting, base64, JWT decoding,
regex testing, diffing, etc.) into a single app that lives next to the system clock.

It solves three problems with the status quo:

1. **Privacy/trust** — developers paste tokens, payloads, and secrets into random
   websites to format or decode them. Bancada does everything locally; nothing
   ever leaves the machine.
2. **Friction** — these tools are needed dozens of times a day. A menu bar app that
   toggles instantly with a global shortcut is faster than opening a browser tab.
3. **Fragmentation** — instead of ten bookmarked sites, one app with a command
   palette covers them all.

The app is **offline-only, local-only, no backend**. It targets **macOS only**
(Apple Silicon + Intel universal binary). Built with **Tauri 2** (Rust core +
React/TypeScript/Vite frontend, Tailwind v4, shadcn/ui).

## Goals

- Ship a menu bar app that opens/closes instantly from the macOS status bar.
- Cover the 8 highest-frequency dev tools in the MVP, all running fully offline.
- Make adding a new tool a one-file operation via a central tool registry.
- Provide a Cmd+K command palette and a global shortcut to summon the window.
- Keep the binary small (< 15 MB) and cold-start fast (< 300 ms to visible window).
- No data ever sent over the network; no telemetry.

## User Stories

### US-001: Tauri 2 project scaffold (macOS)
**Description:** As a developer, I need a working Tauri 2 + React + TS + Vite + Tailwind v4 project so I can build features on a solid base.

**Acceptance Criteria:**
- [x] `npm create tauri-app` based scaffold runs on macOS with `npm run tauri dev` (verified structurally: `src-tauri/tauri.conf.json` `beforeDevCommand`/`devUrl` wired, `npm run tauri` script present in `package.json`; actual dev-window rendering needs human visual confirmation, see report)
- [x] Tailwind v4 wired via `@tailwindcss/vite` plugin + single `@import "tailwindcss"` (no `init` command exists in v4) — `vite.config.ts` imports `@tailwindcss/vite`, `src/index.css` has a single `@import "tailwindcss";`
- [x] shadcn/ui installed and a sample `Button` renders — `src/components/ui/button.tsx` present, `components.json` configured
- [x] Path alias `@/` resolves in both Vite and `tsconfig` — `vite.config.ts` `resolve.alias`, `tsconfig.json` `paths` both map `@/*`
- [x] Universal macOS build (`aarch64` + `x86_64`) produces a `.app` — verified end-to-end in Task 17 (`npm run tauri build -- --target universal-apple-darwin`); see report for final size
- [x] Typecheck and lint pass — `npm run typecheck` and `npm run lint` both clean as of Task 17

### US-002: Menu bar (tray) presence with no Dock icon
**Description:** As a user, I want the app to live in the menu bar next to the clock and NOT appear in the Dock or app switcher, so it stays out of my way.

**Acceptance Criteria:**
- [x] A tray icon (template image, adapts to light/dark menu bar) appears in the status bar — `icon_as_template(true)` set on the `TrayIconBuilder` in `src-tauri/src/lib.rs`; `icons/tray-icon.png` is a 22x22 RGBA PNG with no embedded color profile (verified with `sips`/`xxd`). Actual light/dark inversion is visual-only and still needs human confirmation, see report.
- [x] Activation policy set to `Accessory` so no Dock icon and no app-switcher entry — `app.set_activation_policy(tauri::ActivationPolicy::Accessory)` in `lib.rs` `.setup()`
- [x] App keeps running with all windows hidden — window starts `"visible": false` in `tauri.conf.json`; `CloseRequested` handler calls `prevent_close()` + `hide()` instead of exiting
- [x] Typecheck passes

### US-003: Toggle window from tray and global shortcut
**Description:** As a user, I want to click the tray icon (or press a global shortcut) to show/hide the main window so I can summon a tool instantly.

**Acceptance Criteria:**
- [x] Left-click on tray icon toggles the main window visible/hidden — `on_tray_icon_event` matches `MouseButton::Left` + `MouseButtonState::Up` and calls `toggle_window` in `lib.rs`
- [ ] Window appears anchored near the top-right, just under the menu bar (popover feel) — code calls `move_window(Position::TrayCenter)`, but actual on-screen placement is visual-only; still needs human confirmation, see report
- [x] Global shortcut (default `Cmd+Shift+Space`) toggles the window from any app — `app.global_shortcut().register("CmdOrCtrl+Shift+Space")` in `.setup()`, handler gated on `ShortcutState::Pressed` calls `toggle_window`
- [ ] When shown, the window receives focus and the search/command input is focused — code path exists (`set_focus()` + `activate_app()` in Rust, `window-shown` listener focusing `#search-input` in `main.tsx`), but whether focus is actually received is the same class of OS-activation issue as the deferred US-004 bug; needs human confirmation, see report
- [ ] When the window loses focus (clicks outside), it auto-hides — `onFocusChanged` → `hide()` exists in `src/lib/window.ts`, but actual blur-triggered hide behavior is visual/interactive; needs human confirmation, see report
- [x] Typecheck passes
- [ ] Verify visually that toggle + anchoring work — needs human confirmation, see report

### US-004: Close hides instead of quitting
**Description:** As a user, I want closing the window to hide it back to the menu bar (not quit the app), so the app is always one click away.

**Acceptance Criteria:**
- [ ] Pressing the window close control or `Cmd+W`/`Esc` hides the window, app stays alive in tray — **KNOWN ISSUE (deferred 2026-06-24):** still broken after an `NSApplication::activate()` fix attempt (commit `595b24e`); window doesn't reliably receive keyboard focus. User deferred to unblock Task 6+; revisit before Task 17. **Status as of Task 17: still unresolved, intentionally left unchecked per user instruction — not attempted this task.**
- [x] App only quits via the tray menu "Quit" item — `Cmd+Q` does NOT quit the app (changed from the original spec after user testing: the only way to quit is the tray menu, so the app can't be accidentally killed by a stray keystroke) — verified independently via `grep -n "accelerator" src-tauri/src/lib.rs` (zero matches that bind a quit accelerator; the only `.accelerator(` hits are absent entirely — comments explicitly note none is set on `quit_item` in both `setup()` and `rebuild_tray_menu`), and `grep -n "enable_macos_default_menu" src-tauri/src/lib.rs` shows a single `.enable_macos_default_menu(false)` call, which removes Tauri's auto-generated default macOS app menu (and its standard Cmd+Q binding)
- [x] Re-opening restores the last active tool and its input state (in-memory for the session) — `src/lib/lastTool.ts` holds `lastToolId` in a module-level variable (in-memory, per PRD's resolved Open Question — not disk-persisted), read/written via `getLastToolId()`/`setLastToolId()` in `App.tsx`; per-tool text state is local `useState` that simply isn't unmounted across hide/show, so it survives for the session
- [x] Typecheck passes

### US-005: Tray context menu with quick shortcuts
**Description:** As a user, I want a right-click menu on the tray icon with shortcuts to jump straight to a specific tool, plus Settings and Quit.

**Acceptance Criteria:**
- [ ] Right-click tray icon opens a native menu — `show_menu_on_left_click(false)` is set so right-click falls through to the native default; cannot visually confirm the menu actually opens without a display, see report
- [x] Menu lists 4–6 pinned tools; selecting one shows the window with that tool active — `DEFAULT_SETTINGS.pinnedTools` in `src/store/settings.ts` has 4 entries; `rebuild_tray_menu` Rust command builds one `MenuItemBuilder` per pinned tool and `on_menu_event`'s `id if id.starts_with("tool:")` branch calls `toggle_window_show` + emits `tray-select-tool`, which `App.tsx`'s listener uses to call `setActiveToolId`
- [x] Menu includes "Open Bancada", a separator, "Settings…", and "Quit Bancada" — mouse-click only, no `Cmd+Q` keyboard accelerator (this is the app's only quit path, by design) — all four items present in both `setup()`'s initial menu and `rebuild_tray_menu`; `grep -n "accelerator"` confirms zero `.accelerator(` calls anywhere in `lib.rs`
- [x] Typecheck passes

### US-006: Tool registry + auto-generated navigation
**Description:** As a developer, I want each tool to register itself in a central registry so the sidebar, search, and command palette are generated automatically.

**Acceptance Criteria:**
- [x] A `Tool` interface defines `id`, `name`, `category`, `icon`, `keywords`, `component` — `src/lib/tool.ts` has exactly these six fields
- [x] A registry exports all tools; adding a tool = create one file + one register line — `src/tools/registry.ts` imports 8 tool modules and lists them in the `tools` array, plus derives `toolsById`
- [x] Sidebar list and category grouping render from the registry (no hardcoded nav) — `src/components/Sidebar.tsx` does `tools.reduce(...)` grouped by `tool.category`, no hardcoded tool list
- [x] Typecheck passes
- [ ] Verify in browser/window that the nav reflects registered tools — needs human visual confirmation, see report

### US-007: Command palette (Cmd+K)
**Description:** As a user, I want a fuzzy-search command palette to jump to any tool by name or keyword without using the mouse.

**Acceptance Criteria:**
- [x] `Cmd+K` opens an overlay search input — `App.tsx`'s `handleKeyDown` checks `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"` and calls `setPaletteOpen(true)`; `CommandPalette` renders the overlay `<div className="fixed inset-0 z-50 ...">`
- [x] Typing fuzzy-matches against tool `name` and `keywords` — `CommandPaletteContent`'s `results` memo runs `fuzzyScore(query, h)` over `[tool.name, ...tool.keywords]` for every tool
- [x] Arrow keys navigate, Enter selects, Esc closes — `handleKeyDown` in `CommandPalette.tsx` handles `"ArrowDown"`, `"ArrowUp"`, `"Enter"`, `"Escape"` explicitly
- [x] Selecting a result switches the active tool and closes the palette — both the `Enter` branch and the result button's `onClick` call `onSelect(tool.id)` then `onClose()`
- [x] Typecheck passes
- [ ] Verify in window that palette opens, filters, and selects — needs human visual confirmation, see report

### US-008: JSON formatter / validator
**Description:** As a user, I want to paste JSON and get it pretty-printed, minified, or validated with a clear error location.

**Acceptance Criteria:**
- [x] Input pane + output pane with syntax highlighting — `JsonFormatter.tsx` renders dual panes via `ToolShell`/textarea + `<pre>` output
- [x] Buttons: Format (2-space), Minify, Copy output — "Format" and "Minify" buttons plus `<CopyButton>` present
- [x] Invalid JSON shows a readable error with line/column — `format.ts`'s `describeError` returns `"${message} (line ${line}, column ${column})"`, covered by `format.test.ts`
- [x] Runs entirely client-side (no network) — uses only `JSON.parse`/`JSON.stringify`, no `fetch`/`invoke` calls; confirmed by repo-wide network grep, see report
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-009: Base64 encode / decode
**Description:** As a user, I want to encode text to base64 and decode base64 back to text.

**Acceptance Criteria:**
- [x] Toggle between Encode and Decode — `Base64Tool.tsx` has Encode/Decode `Button`s switching local `mode` state
- [x] Handles UTF-8 correctly (not just ASCII) — `encodeBase64`/`decodeBase64` use `TextEncoder`/`TextDecoder("utf-8", { fatal: true })`, not raw `btoa`/`atob` on the string directly
- [x] URL-safe variant option — `urlSafe` `Switch` toggles `toUrlSafe`/`fromUrlSafe` transforms
- [x] Copy output button; invalid input shows an inline error — `<CopyButton>` present; decode failure renders `result.error` in a destructive-styled box
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-010: JWT decoder
**Description:** As a user, I want to paste a JWT and see its decoded header and payload, plus expiry status.

**Acceptance Criteria:**
- [x] Splits and base64url-decodes header + payload, pretty-printed — `decode.ts`'s `decodeJwt` splits on `.`, base64url-decodes, `JSON.parse`s header/payload; `JwtDecoder.tsx` pretty-prints via `JSON.stringify(..., null, 2)`
- [x] Shows `exp`/`iat`/`nbf` as human-readable dates when present — `JwtDecoder.tsx` conditionally renders `iat`/`nbf`/`exp` lines via `formatTimestamp`, guarded so absent claims don't render
- [x] Visual indicator if the token is expired — `decode.ts` computes `expired` (`Date.now() >= exp * 1000`), `JwtDecoder.tsx` branches on `result.expired`
- [x] Does NOT verify signatures (decoding only, stated in UI) — no secrets needed — `JwtDecoder.tsx` renders the literal text "Decoding only — signatures are not verified, no secret is required."
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-011: Timestamp converter
**Description:** As a user, I want to convert between Unix timestamps and human-readable dates in local and UTC.

**Acceptance Criteria:**
- [x] Input accepts seconds or milliseconds (auto-detect or toggle) — `TimestampConverter.tsx` has `["auto", "seconds", "milliseconds"]` unit toggle buttons
- [x] Shows local time, UTC, and ISO 8601 — `Local:`, `UTC:`, `ISO 8601:` rows each with their own `CopyButton`
- [x] "Now" button inserts the current timestamp — `Button` calling `setTsInput(String(nowTimestamp().seconds))`
- [x] Reverse: pick a date → get the timestamp — `type="datetime-local"` input feeding `reversed.seconds`/`reversed.milliseconds` display
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-012: Regex tester
**Description:** As a user, I want to test a regular expression against sample text with live match highlighting.

**Acceptance Criteria:**
- [x] Pattern input + flags (g, i, m, s, u) + test-string textarea — `FLAG_OPTIONS = ["g", "i", "m", "s", "u"]` rendered as toggle buttons, plus pattern input and test-string textarea
- [x] Matches highlighted inline in the test string — `highlighted` memo wraps each match in `<mark>`
- [x] Capture groups listed for the current match — "Capture groups" section renders `JSON.stringify({ groups, named: namedGroups })` for `result.matches[0]`
- [x] Invalid pattern shows an inline error — `!result.ok` branch renders `result.error` in a destructive box; `findMatches` has a documented 10000-iteration safety cap with a regression test (`match.test.ts`)
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-013: Text diff
**Description:** As a user, I want to compare two blocks of text and see additions/removals.

**Acceptance Criteria:**
- [x] Two input panes (left/right) — `TextDiff.tsx` renders `left`/`right` textareas side by side in a 2-col grid
- [x] Line-level diff with added/removed highlighting — uses `diffLines` from the `diff` package, with `splitChunkLines` documented edge-case handling for trailing-newline artifacts; rendered with added/removed styling per chunk
- [x] Toggle for ignore-whitespace — `Switch` bound to `ignoreWhitespace`, passed through to `diffLines(left, right, { ignoreWhitespace })`
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-014: Color converter
**Description:** As a user, I want to convert a color between HEX, RGB, and HSL and preview it.

**Acceptance Criteria:**
- [x] Input any of HEX / RGB / HSL; other formats update live — `parseColor` in `convert.ts` (covered by `convert.test.ts`) accepts all three formats and the component derives `result.hex`/`result.rgb`/`result.hsl` from a single `input` via `useMemo`
- [x] Color swatch preview — `<div>` with `style={{ backgroundColor: result.hex }}` and `aria-label="color preview"`
- [x] Copy any format with one click — `<CopyButton>` next to each of hex/rgb/hsl
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-015: Hash generator
**Description:** As a user, I want to generate MD5 / SHA-1 / SHA-256 hashes of input text.

**Acceptance Criteria:**
- [x] Text input produces all three hashes simultaneously — `HashGenerator.tsx`'s effect runs `Promise.all([md5Hex, sha1Hex, sha256Hex])` together on every `input` change
- [x] Copy button per hash — `<CopyButton>` rendered per algorithm row
- [x] Computed locally (Web Crypto for SHA; small lib or Rust command for MD5) — `hash.ts`'s `sha1Hex`/`sha256Hex` use `crypto.subtle.digest`; `md5Hex` calls the Rust `md5_hash` command via `invoke`, implemented with the `md-5` crate in `lib.rs`, unit-tested (`md5_of_known_string`, `md5_of_empty_string`)
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

### US-016: Settings (shortcut + theme + launch at login)
**Description:** As a user, I want to configure the global shortcut, theme, and whether the app launches at login.

**Acceptance Criteria:**
- [x] Settings view: change global shortcut, theme (system/light/dark), pinned tools for the tray menu — `Settings.tsx` has Theme buttons (system/light/dark), a shortcut input + Save, and a pinned-tools checkbox grid (capped at `MAX_PINNED = 6`)
- [x] "Launch at login" toggle (via Tauri autostart plugin) — `Switch` wired to `enableAutostart`/`disableAutostart`/`isAutostartEnabled` from `@tauri-apps/plugin-autostart`
- [x] Settings persist to disk (Tauri store / JSON in app config dir) and reload on start — `src/store/settings.ts` uses `@tauri-apps/plugin-store`'s `load("settings.json", { autoSave: true })`; `App.tsx`'s mount effect calls `loadSettings()` and reconciles shortcut + tray menu from disk state
- [x] Typecheck passes
- [ ] Verify in window — needs human visual confirmation, see report

## Functional Requirements

- FR-1: The app must run as a macOS menu bar app with no Dock icon (activation policy `Accessory`).
- FR-2: Left-clicking the tray icon must toggle the main window; a configurable global shortcut must do the same.
- FR-3: The window must auto-hide on focus loss and on `Esc`/`Cmd+W`/close control.
- FR-4: Closing the window must NOT quit the app; only the tray "Quit" item quits. `Cmd+Q` must NOT quit the app.
- FR-5: Right-clicking the tray icon must open a native menu with pinned tool shortcuts, Settings, and Quit.
- FR-6: Every tool must be defined as a `Tool` object and registered in a single central registry.
- FR-7: The sidebar/navigation, search, and command palette must be generated from the registry.
- FR-8: `Cmd+K` must open a fuzzy command palette over tools.
- FR-9: The MVP must include these tools: JSON formatter, Base64, JWT decoder, Timestamp converter, Regex tester, Text diff, Color converter, Hash generator.
- FR-10: No tool may make a network request; the app must function fully offline.
- FR-11: User settings (shortcut, theme, pinned tools, launch-at-login) must persist across restarts.
- FR-12: The build output must be a universal `.app` for Apple Silicon and Intel.

## Non-Goals (Out of Scope)

- No Windows or Linux build (macOS only for v1).
- No backend, account system, sync, or cloud storage.
- No telemetry or analytics of any kind.
- No JWT signature verification (decode only).
- No file-based tools in MVP (file hashing, image conversion, etc. are post-MVP).
- No plugin marketplace or third-party tool installation.
- No multi-window support; one main window is enough.

## Design Considerations

- See `claude-design-prompt.md` for the full visual brief.
- Popover-style window anchored under the menu bar; compact but resizable.
- Native macOS feel: vibrancy/translucency background, SF-style typography, subtle.
- Light/dark following the system theme by default.
- Tray icon must be a monochrome template image so it adapts to the menu bar.

## Technical Considerations

- **Stack:** Tauri 2.x, React 18, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, lucide-react icons.
- **Tray + lifecycle:** `TrayIconBuilder` in the Rust `setup`; intercept `WindowEvent::CloseRequested` to hide instead of close; `app.set_activation_policy(ActivationPolicy::Accessory)`.
- **Window anchoring:** `tauri-plugin-positioner` (TrayCenter / TopRight) for popover placement.
- **Global shortcut:** `tauri-plugin-global-shortcut`.
- **Autostart:** `tauri-plugin-autostart`.
- **Persistence:** `tauri-plugin-store` or a JSON file in the app config dir.
- **Most tools are pure TypeScript;** Rust commands only where they earn it (e.g. MD5, future file hashing).
- See `CLAUDE.md` for architecture, conventions, and build order.

## Success Metrics

- Cold start to visible window under 300 ms.
- Release `.app` under 15 MB.
- Adding a new tool touches exactly one new file plus one registry line.
- Window summon (shortcut → focused input) feels instant (no perceptible lag).
- Zero network requests observed during normal use.

## Open Questions

- Popover-anchored window vs. a free-floating resizable window — start with anchored popover, revisit if tools feel cramped.
- Should tool input state persist to disk between full app restarts, or only in-memory for the session? (MVP: in-memory.)
- MD5 via a small JS lib vs. a Rust command — decide during US-015.
- Code signing + notarization: required for distribution outside the dev machine; out of MVP build scope but needed before sharing.