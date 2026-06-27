import Papa from "papaparse";

export type ConvertResult = { ok: true; value: string } | { ok: false; error: string };

export function csvToJson(csv: string): ConvertResult {
  if (csv.trim() === "") return { ok: true, value: "" };
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (result.errors.length > 0) {
    return { ok: false, error: result.errors[0].message };
  }
  return { ok: true, value: JSON.stringify(result.data, null, 2) };
}

export function jsonToCsv(json: string): ConvertResult {
  if (json.trim() === "") return { ok: true, value: "" };
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) {
      return { ok: false, error: "Input must be a JSON array of objects" };
    }
    return { ok: true, value: Papa.unparse(data) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
