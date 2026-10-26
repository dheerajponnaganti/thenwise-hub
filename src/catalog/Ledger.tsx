import type { ReactNode } from 'react'

/** The circulation desk ledger: a ruled table. On a phone each row becomes one card, with the column names as labels. */
export function Ledger({ caption, columns, children }: { caption: string; columns: string[]; children: ReactNode }) {
  return (
    <table className="ledger">
      <caption className="sr">{caption}</caption>
      <thead><tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  )
}

export const LedgerRow = ({ children, struck }: { children: ReactNode; struck?: boolean }) => <tr className={struck ? 'struck' : ''}>{children}</tr>
export const LedgerCell = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => <td data-label={label} className={className}>{children}</td>
