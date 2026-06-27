import { describe, expect, it } from "vitest";
import { jsonToYaml, yamlToJson } from "./convert";

describe("jsonToYaml", () => {
  it("converts a JSON object to YAML", () => {
    const result = jsonToYaml('{"name":"Dev Workbench","tags":["dev","tools"]}');
    expect(result).toEqual({ ok: true, value: "name: Dev Workbench\ntags:\n  - dev\n  - tools\n" });
  });

  it("returns an error for invalid JSON", () => {
    const result = jsonToYaml("not json");
    expect(result.ok).toBe(false);
  });
});

describe("yamlToJson", () => {
  it("converts YAML to pretty JSON", () => {
    const result = yamlToJson("name: Dev Workbench\ntags:\n  - dev\n  - tools\n");
    expect(result).toEqual({ ok: true, value: '{\n  "name": "Dev Workbench",\n  "tags": [\n    "dev",\n    "tools"\n  ]\n}' });
  });

  it("returns an error for invalid YAML", () => {
    const result = yamlToJson("key: [unterminated");
    expect(result.ok).toBe(false);
  });

  it("round-trips JSON -> YAML -> JSON", () => {
    const original = '{"a":1,"b":{"c":true}}';
    const yaml = jsonToYaml(original);
    expect(yaml.ok).toBe(true);
    if (yaml.ok) {
      const back = yamlToJson(yaml.value);
      expect(back.ok).toBe(true);
      if (back.ok) expect(JSON.parse(back.value)).toEqual(JSON.parse(original));
    }
  });
});
