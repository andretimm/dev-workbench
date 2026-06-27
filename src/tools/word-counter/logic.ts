export interface TextStats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingSeconds: number;
}

export function analyzeText(text: string): TextStats {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+(?:\s|$)/g) ?? []).length;
  const paragraphs = text.trim() === "" ? 0 : text.trim().split(/\n\s*\n+/).length;
  const lines = text === "" ? 1 : text.split("\n").length;
  const readingSeconds = Math.round((words / 238) * 60); // 238 WPM average
  return { chars, charsNoSpaces, words, sentences, paragraphs, lines, readingSeconds };
}

export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
