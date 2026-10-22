export const MAX_HINTS = 3;

export function nextHint(targets, foundWordIds, hintsUsed) {
  if (hintsUsed >= MAX_HINTS) return null;
  const found = new Set(foundWordIds);
  const target = [...targets]
    .filter((word) => !found.has(word.id))
    .sort((left, right) => left.normalized < right.normalized ? -1 : left.normalized > right.normalized ? 1 : 0)[0];
  if (!target) return null;
  return {
    targetId: target.id,
    cell: target.cells[0],
    hintsUsed: hintsUsed + 1
  };
}
