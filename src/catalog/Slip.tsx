import { stampDate } from '../api/format'

/** The borrower's slip: who shared the card, when, and which revision. */
export function BorrowerSlip({ owner, at, rev }: { owner: string; at: number; rev: number }) {
  return (
    <dl className="borrower" aria-label="Borrower's slip">
      <dt>Shared by</dt>
      <dd>{owner}</dd>
      <dt>Filed</dt>
      <dd className="mono">{stampDate(at)}</dd>
      <dt>Revision</dt>
      <dd className="mono">{rev}</dd>
    </dl>
  )
}
