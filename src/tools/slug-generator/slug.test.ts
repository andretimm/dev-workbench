import { describe, expect, it } from "vitest";
import { toSlug } from "./slug";

describe("toSlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(toSlug("Hello World")).toBe("hello-world");
  });

  it("strips accents/diacritics", () => {
    expect(toSlug("Café déjà vu")).toBe("cafe-deja-vu");
  });

  it("collapses runs of non-alphanumeric chars into a single hyphen", () => {
    expect(toSlug("a__b  --  c!!d")).toBe("a-b-c-d");
  });

  it("trims leading and trailing hyphens", () => {
    expect(toSlug("  --hello--  ")).toBe("hello");
  });

  it("handles already-slugged input as a no-op", () => {
    expect(toSlug("already-a-slug")).toBe("already-a-slug");
  });
});
