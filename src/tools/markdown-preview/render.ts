import { marked } from "marked";

marked.setOptions({ async: false });

export function renderMarkdown(input: string): string {
  return marked.parse(input) as string;
}
