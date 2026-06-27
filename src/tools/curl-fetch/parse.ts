export interface ParsedRequest {
  method: string;
  url: string;
  headers: [string, string][];
  body: string | null;
}

export type ParseResult = { ok: true; value: string } | { ok: false; error: string };

function tokenize(input: string): string[] {
  const line = input.replace(/\\\n\s*/g, " ").trim();
  const tokens: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === " " || line[i] === "\t") { i++; continue; }
    if (line[i] === '"') {
      let j = i + 1;
      let s = "";
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\" && j + 1 < line.length) { s += line[j + 1]; j += 2; } else { s += line[j++]; }
      }
      tokens.push(s); i = j + 1;
    } else if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") j++;
      tokens.push(line.slice(i + 1, j)); i = j + 1;
    } else {
      let j = i;
      while (j < line.length && line[j] !== " " && line[j] !== "\t") j++;
      tokens.push(line.slice(i, j)); i = j;
    }
  }
  return tokens;
}

function parseCurl(cmd: string): ParsedRequest {
  const tokens = tokenize(cmd);
  let i = 0;
  if (tokens[0]?.toLowerCase() === "curl") i++;

  let method = "GET";
  let url = "";
  const headers: [string, string][] = [];
  let body: string | null = null;

  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "-X" || t === "--request") {
      method = tokens[++i] ?? method;
    } else if (t === "-H" || t === "--header") {
      const raw = tokens[++i] ?? "";
      const colon = raw.indexOf(":");
      if (colon > -1) headers.push([raw.slice(0, colon).trim(), raw.slice(colon + 1).trim()]);
    } else if (["-d", "--data", "--data-raw", "--data-ascii", "--data-binary"].includes(t)) {
      body = tokens[++i] ?? "";
      if (method === "GET") method = "POST";
    } else if (t === "--json") {
      body = tokens[++i] ?? "";
      method = "POST";
      headers.push(["Content-Type", "application/json"]);
      headers.push(["Accept", "application/json"]);
    } else if (t === "-u" || t === "--user") {
      const creds = tokens[++i] ?? "";
      headers.push(["Authorization", "Basic " + btoa(creds)]);
    } else if (t === "-b" || t === "--cookie") {
      headers.push(["Cookie", tokens[++i] ?? ""]);
    } else if (t === "-A" || t === "--user-agent") {
      headers.push(["User-Agent", tokens[++i] ?? ""]);
    } else if (!t.startsWith("-") && t !== "") {
      url = t;
    }
    i++;
  }

  return { method, url, headers, body };
}

function requestToFetch(req: ParsedRequest): string {
  if (!req.url) return "";
  const opts: string[] = [];
  if (req.method !== "GET") opts.push(`  method: "${req.method}"`);
  if (req.headers.length > 0) {
    const h = req.headers.map(([k, v]) => `    "${k}": "${v}"`).join(",\n");
    opts.push(`  headers: {\n${h}\n  }`);
  }
  if (req.body != null) {
    let bodyExpr: string;
    try { JSON.parse(req.body); bodyExpr = `JSON.stringify(${req.body})`; }
    catch { bodyExpr = JSON.stringify(req.body); }
    opts.push(`  body: ${bodyExpr}`);
  }
  const url = JSON.stringify(req.url);
  if (opts.length === 0) return `fetch(${url})`;
  return `fetch(${url}, {\n${opts.join(",\n")}\n})`;
}

export function curlToFetch(cmd: string): ParseResult {
  const trimmed = cmd.trim();
  if (trimmed === "") return { ok: true, value: "" };
  if (!trimmed.toLowerCase().startsWith("curl")) {
    return { ok: false, error: "Input must start with 'curl'" };
  }
  try {
    const req = parseCurl(trimmed);
    if (!req.url) return { ok: false, error: "No URL found in curl command" };
    return { ok: true, value: requestToFetch(req) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function fetchToCurl(code: string): ParseResult {
  const trimmed = code.trim();
  if (trimmed === "") return { ok: true, value: "" };

  const urlMatch = trimmed.match(/fetch\s*\(\s*["'`]([^"'`]+)["'`]/);
  if (!urlMatch) return { ok: false, error: "Cannot find fetch(URL) in input" };
  const url = urlMatch[1];

  const methodMatch = trimmed.match(/method\s*:\s*["']([A-Za-z]+)["']/);
  const method = methodMatch?.[1]?.toUpperCase() ?? "GET";

  const headers: [string, string][] = [];
  const headersBlock = trimmed.match(/headers\s*:\s*\{([\s\S]*?)\}/);
  if (headersBlock) {
    const re = /["']([^"']+)["']\s*:\s*["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(headersBlock[1])) !== null) {
      headers.push([m[1], m[2]]);
    }
  }

  const bodyMatch = trimmed.match(/body\s*:\s*(.+)/);
  const body = bodyMatch?.[1]?.replace(/[,}]\s*$/, "").trim() ?? null;

  const parts: string[] = ["curl"];
  if (method !== "GET") parts.push(`  -X ${method}`);
  for (const [k, v] of headers) parts.push(`  -H '${k}: ${v}'`);
  if (body) parts.push(`  -d '${body}'`);
  parts.push(`  '${url}'`);

  return { ok: true, value: parts.join(" \\\n") };
}
