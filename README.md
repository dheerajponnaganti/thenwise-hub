# Thenwise Hub

A web console for [Thenwise](https://github.com/dheerajponnaganti/thenwise) Teams. Your team reads, searches and looks after its shared memory in a browser, on a laptop or a phone.

The look is a library card catalog: paper, ink and one red. Every note is an index card with a call number, a date stamp and a borrower's slip.

## Run it

Build the Hub, then let the team server serve it on the same origin:

```sh
npm ci
npm run build
thenwise team serve --dir ./team-data --console ./dist
thenwise team invite alice --dir ./team-data   # prints a token for the first member, the owner
```

Open `http://127.0.0.1:<port>`, paste the token, or open an invite link of the form `/join?code=<code>` and choose a name.

Without a build, any static host works too if the server lists its origin with `--allow-origin`.

## Develop

```sh
npm run dev          # Vite on :5173, proxies /v1 to a server on :4170
npm test             # unit tests (Vitest)
npm run e2e          # builds, starts a real thenwise server, runs Playwright
npm run gen:types    # regenerates src/api/types.ts from api/openapi.json
```

`api/openapi.json` is a copy of the frozen v1 spec from thenwise. `npm run build` fails when `src/api/types.ts` no longer matches it.

The end-to-end tests need a thenwise checkout. Set `THENWISE_SRC` to its folder. Install the browser once with `npx playwright install chromium`.

`/catalog` shows every component in both themes.

## Compatibility

Thenwise Hub 0.x needs `thenwise >= 0.1.12` (Teams API v1). The Hub has its own version numbers.

## Licence

MIT. The fonts (Newsreader, Source Sans 3, Courier Prime) are under the SIL Open Font Licence. The licence files are in `src/fonts/`.
