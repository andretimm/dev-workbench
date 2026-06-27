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
