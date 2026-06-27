import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/store/settings", () => ({
  DEFAULT_SHORTCUT: "CmdOrCtrl+Shift+Space",
  loadSettings: vi.fn().mockResolvedValue({
    theme: "system",
    shortcut: "CmdOrCtrl+Shift+Space",
    pinnedTools: ["json-formatter", "base64", "jwt-decoder", "timestamp"],
    launchAtLogin: false,
  }),
}));

describe("App", () => {
  it("renders the sidebar and the Home screen by default", () => {
    render(<App />);
    expect(screen.getAllByText("JSON Formatter").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dev Workbench").length).toBeGreaterThan(0);
    expect(screen.getByText("Your dev toolbox, one shortcut away.")).toBeInTheDocument();
  });
});
