export type DiffLine = { type: 'same' | 'del' | 'add'; text: string }

/** A line diff from `theirs` to `mine`: `del` lines are only in theirs, `add` lines only in mine. */
export function lineDiff(theirs: string, mine: string): DiffLine[] {
  const a = theirs.split('\n')
  const b = mine.split('\n')
  // Longest common subsequence table. Cards are at most 100 KB, so the quadratic table stays small in practice.
  const t: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) t[i]![j] = a[i] === b[j] ? t[i + 1]![j + 1]! + 1 : Math.max(t[i + 1]![j]!, t[i]![j + 1]!)
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i]! })
      i++
      j++
    }
    else if (t[i + 1]![j]! >= t[i]![j + 1]!) out.push({ type: 'del', text: a[i++]! })
    else out.push({ type: 'add', text: b[j++]! })
  }
  while (i < a.length) out.push({ type: 'del', text: a[i++]! })
  while (j < b.length) out.push({ type: 'add', text: b[j++]! })
  return out
}
