/** Why a card cannot be the newer card, in plain words. Null when it can. The server checks too. */
export function supersedeProblem(old: { owner: string; id: string }, by: { owner: string; id: string; status: string }): string | null {
  if (old.owner === by.owner && old.id === by.id) return 'A card cannot replace itself. Pick a different card.'
  if (by.status === 'pending') return 'That card is still waiting for review. Approve it first.'
  if (by.status === 'retired') return 'That card is retired. Pick an active card.'
  if (by.status === 'superseded') return 'That card has been replaced already. Pick the newer one.'
  return null
}
