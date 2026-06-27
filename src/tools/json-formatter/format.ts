export type JsonResult = { ok: true; value: string } | { ok: false; error: string };

function describeError(input: string, err: unknown): string {
  if (!(err instanceof SyntaxError)) return String(err);

  const positionMatch = err.message.match(/position (\d+)/);
  if (positionMatch) {
    return withLineColumn(err.message, input, Number(positionMatch[1]));
  }

  const tokenMatch = err.message.match(/^Unexpected token (?:'(.)'|"(.+?)"), "(.*)" is not valid JSON$/);
  if (tokenMatch) {
    const tokenChar = tokenMatch[1] ?? tokenMatch[2];
    const snippet = tokenMatch[3];
    const isUntruncated = snippet === input;
    if (isUntruncated && countOccurrences(input, tokenChar) === 1) {
      return withLineColumn(err.message, input, input.indexOf(tokenChar));
    }
  }

  return err.message;
}

function withLineColumn(message: string, input: string, position: number): string {
  const upToError = input.slice(0, position);
  const line = upToError.split("\n").length;
  const column = position - upToError.lastIndexOf("\n");
  return `${message} (line ${line}, column ${column})`;
}

function countOccurrences(str: string, ch: string): number {
  let count = 0;
  for (const c of str) if (c === ch) count++;
  return count;
}

export function formatJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, 2) };
  } catch (err) {
    return { ok: false, error: describeError(input, err) };
  }
}

export function minifyJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed) };
  } catch (err) {
    return { ok: false, error: describeError(input, err) };
  }
}
