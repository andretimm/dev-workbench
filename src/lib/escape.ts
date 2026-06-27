import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Esc hides the window (Cmd+W triggers the OS-level `CloseRequested` event,
 * which the Rust side already intercepts to hide instead of quit — see
 * `src-tauri/src/lib.rs`). This covers the keyboard-only dismissal path.
 */
export function setupEscapeHide() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      getCurrentWindow().hide();
    }
  });
}
