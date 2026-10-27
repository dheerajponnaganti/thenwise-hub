import { FootnoteMark, Footnotes, BorrowerSlip, Card, Glyph, NoteStamps, Stamp, AsOf, SupersededSlip, DrawerFace, Volume, Spine, Leaf, type GlyphName } from '../catalog'

const VOLUME = { owner: 'alice', session: 's1', project: 'payments', rev: 1, started_at: Date.UTC(2026, 9, 20), ended_at: Date.UTC(2026, 9, 20), head: 'Why split the shards by tenant?', mask: 1, bytes: 2048, turn_count: 2 }
const GLYPHS: GlyphName[] = ['card', 'drawer', 'stamp', 'slip', 'footnote', 'clock']

function Specimen() {
  return (
    <>
      <h3>Stamps</h3>
      <div className="stamps">
        <Stamp>DECIDED</Stamp><Stamp>ABANDONED</Stamp><Stamp>RETIRED</Stamp><Stamp>PINNED</Stamp><Stamp>MASKED</Stamp><Stamp dashed>PENDING</Stamp>
        <AsOf date="06 OCT" /><SupersededSlip to="alice/older" label="alice/newer" />
      </div>
      <h3>Card</h3>
      <Card call="alice/auth-flow" at={Date.UTC(2026, 9, 6)}>
        <h2>Sessions use two cookies<FootnoteMark n={1} /></h2>
        <NoteStamps n={{ owner: 'alice', kind: 'decision', status: 'active', pinned: true, superseded_by: null }} />
        <p>The session cookie is httpOnly. The CSRF cookie is readable and echoed in a header.</p>
        <BorrowerSlip owner="alice" at={Date.UTC(2026, 9, 6)} rev={3} />
        <Footnotes sources={['commit 2ff40d5']} />
      </Card>
      <h3>Drawer</h3>
      <ul className="cabinet"><li><DrawerFace project="payments" count={12} /></li></ul>
      <h3>Volume and leaves</h3>
      <Volume c={VOLUME} snippet="…why we split the **shards** by tenant…" turn="t1" />
      <Spine c={VOLUME} />
      <Leaf n={1} t={{ id: 't1', at: Date.UTC(2026, 9, 20), line: 'Why split the shards?', passages: ['Why split the shards?\n\nBy tenant. A <script> tag stays text.'], paths: ['src/db/shards.ts'], shas: ['2ff40d5'] }} />
      <Leaf n={2} t={{ id: 't2', at: Date.UTC(2026, 9, 20), line: 'Try one big table', passages: ['It was too slow.'], dead_end: true, dead_text: 'One big table was too slow.' }} />
      <h3>Glyphs</h3>
      <p>{GLYPHS.map((g) => <span key={g} title={g}> <Glyph name={g} size={28} title={g} /> </span>)}</p>
    </>
  )
}

/** Every component in both themes. Open /catalog. */
export function CatalogPage() {
  return (
    <>
      <h1>Catalog</h1>
      <p className="muted">Every component, once in the reading room and once in the night archive.</p>
      <section className="catalog-demo" data-theme="light" aria-label="Reading room"><h2>Reading room</h2><Specimen /></section>
      <section className="catalog-demo" data-theme="dark" aria-label="Night archive"><h2>Night archive</h2><Specimen /></section>
    </>
  )
}
