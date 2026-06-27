const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et",
  "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis",
  "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex",
  "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur",
];

function capitalize(word: string): string {
  return word[0].toUpperCase() + word.slice(1);
}

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function generateWords(count: number): string {
  const n = Math.max(1, Math.trunc(count));
  return Array.from({ length: n }, randomWord).join(" ");
}

export function generateSentence(): string {
  const length = 6 + Math.floor(Math.random() * 10);
  const words = Array.from({ length }, randomWord);
  return capitalize(words.join(" ")) + ".";
}

export function generateSentences(count: number): string {
  const n = Math.max(1, Math.trunc(count));
  return Array.from({ length: n }, generateSentence).join(" ");
}

export function generateParagraph(): string {
  const sentenceCount = 3 + Math.floor(Math.random() * 4);
  return generateSentences(sentenceCount);
}

export function generateParagraphs(count: number): string[] {
  const n = Math.max(1, Math.trunc(count));
  return Array.from({ length: n }, generateParagraph);
}
