export function fuzzyMatch(query: string, target: string): boolean {
  return fuzzyScore(query, target) >= 0;
}

export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;

  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      const isConsecutive = lastMatchIndex === ti - 1;
      const isPrefix = ti === 0;
      score += isConsecutive ? 5 : 1;
      if (isPrefix) score += 10;
      lastMatchIndex = ti;
      qi++;
    }
  }

  return qi === q.length ? score : -1;
}
