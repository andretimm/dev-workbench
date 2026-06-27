import { describe, expect, it } from "vitest";
import {
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  toTitleCase,
} from "./cases";

describe("case converters", () => {
  it("converts from kebab-case", () => {
    expect(toCamelCase("hello-world")).toBe("helloWorld");
    expect(toPascalCase("hello-world")).toBe("HelloWorld");
    expect(toSnakeCase("hello-world")).toBe("hello_world");
    expect(toConstantCase("hello-world")).toBe("HELLO_WORLD");
    expect(toTitleCase("hello-world")).toBe("Hello World");
  });

  it("converts from snake_case", () => {
    expect(toCamelCase("hello_world_again")).toBe("helloWorldAgain");
    expect(toKebabCase("hello_world_again")).toBe("hello-world-again");
  });

  it("converts from camelCase / PascalCase", () => {
    expect(toSnakeCase("helloWorldAgain")).toBe("hello_world_again");
    expect(toKebabCase("HelloWorldAgain")).toBe("hello-world-again");
  });

  it("converts from plain space-separated words", () => {
    expect(toCamelCase("hello world")).toBe("helloWorld");
    expect(toConstantCase("hello world")).toBe("HELLO_WORLD");
  });

  it("handles a single word", () => {
    expect(toCamelCase("hello")).toBe("hello");
    expect(toPascalCase("hello")).toBe("Hello");
  });
});
