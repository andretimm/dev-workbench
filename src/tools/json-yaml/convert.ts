import YAML from "yaml";

export type ConvertResult = { ok: true; value: string } | { ok: false; error: string };

export function jsonToYaml(input: string): ConvertResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: YAML.stringify(parsed) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function yamlToJson(input: string): ConvertResult {
  try {
    const parsed = YAML.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, 2) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
