import type { ReactNode } from 'react'

export interface TrayState { kind: string; status: string; pinned: boolean }

/** The stamp tray: what an editor can press on a card. Shown to editors and up only. */
export function StampTray({ state, busy, on }: { state: TrayState; busy?: boolean; on: { decide: () => void; abandon: () => void; retire: () => void; supersede: () => void; pin: () => void; edit: () => void } }) {
  const B = ({ children, onClick, pressed, tone }: { children: ReactNode; onClick: () => void; pressed?: boolean; tone?: string }) => (
    <button type="button" className={`stamp ${tone ?? ''}`} onClick={onClick} disabled={busy} aria-pressed={pressed}>{children}</button>
  )
  return (
    <div className="tray stamp-tray" role="group" aria-label="Stamp tray">
      <B onClick={on.decide} pressed={state.kind === 'decision'} tone="blue">Decided</B>
      <B onClick={on.abandon} pressed={state.kind === 'dead_end'} tone="red">Abandoned</B>
      <B onClick={on.retire} pressed={state.status === 'retired'} tone="muted">Retired</B>
      <B onClick={on.supersede}>Superseded by →</B>
      <B onClick={on.pin} pressed={state.pinned} tone="blue">{state.pinned ? 'Unpin' : 'Pinned'}</B>
      <B onClick={on.edit}>Edit</B>
    </div>
  )
}
