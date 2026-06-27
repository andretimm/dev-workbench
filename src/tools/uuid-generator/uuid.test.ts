import { describe, expect, it } from "vitest";
import { generateUuids } from "./uuid";

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuids", () => {
  it("generates the requested count of valid v4 UUIDs", () => {
    const ids = generateUuids(5, false);
    expect(ids).toHaveLength(5);
    for (const id of ids) expect(id).toMatch(UUID_V4_RE);
  });

  it("uppercases when requested", () => {
    const [id] = generateUuids(1, true);
    expect(id).toBe(id.toUpperCase());
    expect(id.toLowerCase()).toMatch(UUID_V4_RE);
  });

  it("clamps count to at least 1", () => {
    expect(generateUuids(0, false)).toHaveLength(1);
    expect(generateUuids(-3, false)).toHaveLength(1);
  });

  it("clamps count to at most 50", () => {
    expect(generateUuids(1000, false)).toHaveLength(50);
  });

  it("produces non-repeating values across a batch", () => {
    const ids = generateUuids(20, false);
    expect(new Set(ids).size).toBe(20);
  });
});
