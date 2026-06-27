export interface MatchInfo {
  text: string;
  index: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string>;
}

export type MatchResult = { ok: true; matches: MatchInfo[] } | { ok: false; error: string };

export function findMatches(pattern: string, flags: string, testString: string): MatchResult {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const matches: MatchInfo[] = [];
  let match: RegExpExecArray | null;
  let iterations = 0;
  while ((match = regex.exec(testString)) !== null && iterations < 10000) {
    matches.push({
      text: match[0],
      index: match.index,
      groups: match.slice(1),
      namedGroups: { ...match.groups },
    });
    if (match[0].length === 0) regex.lastIndex++;
    iterations++;
  }

  return { ok: true, matches };
}
