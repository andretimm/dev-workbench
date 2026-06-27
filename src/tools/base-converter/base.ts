export type Base = 2 | 8 | 10 | 16;

const VALID_DIGITS: Record<Base, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-f]+$/i,
};

export function parseInBase(input: string, base: Base): bigint | null {
  const trimmed = input.trim();
  if (trimmed === "" || !VALID_DIGITS[base].test(trimmed)) return null;

  let result = 0n;
  const bigBase = BigInt(base);
  for (const char of trimmed.toLowerCase()) {
    const digit = parseInt(char, 16);
    result = result * bigBase + BigInt(digit);
  }
  return result;
}

export function formatInBase(value: bigint, base: Base): string {
  return value.toString(base);
}

export function convertAllBases(input: string, fromBase: Base): Record<Base, string> {
  const value = parseInBase(input, fromBase);
  if (value === null) return { 2: "", 8: "", 10: "", 16: "" };
  return {
    2: formatInBase(value, 2),
    8: formatInBase(value, 8),
    10: formatInBase(value, 10),
    16: formatInBase(value, 16),
  };
}
