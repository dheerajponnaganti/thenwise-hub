// Small drawn glyphs. No emoji. Each is a 24 px line drawing in the current colour.
const PATHS = {
  card: 'M3 5h18v14H3zM3 9h18M6 13h8',
  drawer: 'M3 6h18v12H3zM9 11h6M3 14h18',
  stamp: 'M8 3h8v6l3 3v2H5v-2l3-3zM4 18h16v3H4z',
  slip: 'M4 6h16v10l-4 4H4zM16 20v-4h4M7 10h10',
  footnote: 'M7 6l2-2v8M6 12h6M15 16h5M17.5 13.5v5',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
} as const
export type GlyphName = keyof typeof PATHS

export function Glyph({ name, size = 20, title }: { name: GlyphName; size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d={PATHS[name]} />
    </svg>
  )
}
