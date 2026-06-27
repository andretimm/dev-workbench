import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

/**
 * Wires the popover-style window behavior shared by every tool:
 * - Hide (don't quit) as soon as the window loses focus, so clicking
 *   anywhere else dismisses it like a native menu bar popover.
 * - Run `onShown` whenever the Rust side toggles the window into view
 *   (tray left-click or the global shortcut), so callers can do things
 *   like focus the command palette's search input.
 */
export function setupWindowBehavior(onShown: () => void) {
  const appWindow = getCurrentWindow();

  appWindow.onFocusChanged(({ payload: focused }) => {
    if (!focused) {
      appWindow.hide();
    }
  });

  listen("window-shown", onShown);
}
