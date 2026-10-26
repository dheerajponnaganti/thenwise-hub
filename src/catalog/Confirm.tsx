import { useEffect, useRef, type ReactNode } from 'react'

/** A slip over the page. It uses the browser's own modal dialog: focus stays inside and Escape closes it.
 * (Radix Dialog injects an inline style tag, which the team server's CSP blocks.) */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className="dialog" aria-labelledby="dlg-title" onClose={onClose}>
      {open && (
        <>
          <h2 id="dlg-title">{title}</h2>
          {children}
        </>
      )}
    </dialog>
  )
}

/** A plain-words question with a yes and a cancel. */
export function Confirm({ open, onOpenChange, title, children, yes, onYes, busy }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; yes: string; onYes: () => void; busy?: boolean }) {
  return (
    <Sheet open={open} onClose={() => onOpenChange(false)} title={title}>
      <div>{children}</div>
      <div className="row actions">
        <button type="button" className="btn red fit" disabled={busy} onClick={onYes}>{yes}</button>
        <button type="button" className="btn ghost fit" onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    </Sheet>
  )
}
