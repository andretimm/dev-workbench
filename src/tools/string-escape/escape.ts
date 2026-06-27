export type EscapeMode = "js" | "url" | "html" | "unicode";

const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};
const HTML_UNESCAPE: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#39;": "'", "&apos;": "'", "&nbsp;": " ",
};

export function escapeStr(input: string, mode: EscapeMode): string {
  switch (mode) {
    case "js":
      return JSON.stringify(input).slice(1, -1);
    case "url":
      return encodeURIComponent(input);
    case "html":
      return input.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
    case "unicode":
      return [...input]
        .map((c) => {
          const cp = c.codePointAt(0)!;
          return cp > 127 ? `\\u${cp.toString(16).padStart(4, "0")}` : c;
        })
        .join("");
  }
}

export function unescapeStr(input: string, mode: EscapeMode): string {
  switch (mode) {
    case "js": {
      try {
        return JSON.parse('"' + input.replace(/(?<!\\)"/g, '\\"') + '"');
      } catch {
        return input;
      }
    }
    case "url": {
      try { return decodeURIComponent(input); } catch { return input; }
    }
    case "html":
      return input
        .replace(/&[a-zA-Z]+;/g, (m) => HTML_UNESCAPE[m] ?? m)
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    case "unicode":
      return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
      );
  }
}

export const MODES: { value: EscapeMode; label: string }[] = [
  { value: "js",      label: "JS / JSON" },
  { value: "url",     label: "URL" },
  { value: "html",    label: "HTML" },
  { value: "unicode", label: "Unicode \\u" },
];
