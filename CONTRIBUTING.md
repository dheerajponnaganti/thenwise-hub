# Contributing to Thenwise Hub

Thanks for stepping into the reading room. Every kind of help counts, and most of it needs no code. Everyone here follows the [code of conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Ask a question** in [Thenwise Discussions](https://github.com/dheerajponnaganti/thenwise/discussions). One place for Thenwise, Teams and the Hub.
- **Report a bug** with the [bug form](https://github.com/dheerajponnaganti/thenwise-hub/issues/new?template=bug.yml). A screenshot and the device help most.
- **Suggest an idea** with the [idea form](https://github.com/dheerajponnaganti/thenwise-hub/issues/new?template=idea.yml).
- **Try it on your phone.** Every screen should work at 360 px wide. Tell us where it does not.
- **Fix a bug or build a screen.** For anything large, open an idea first so we can agree on the shape before you write it.

Server, sync and plugin bugs belong in the [thenwise repo](https://github.com/dheerajponnaganti/thenwise).

## Set up

You need Node 22.16 or later.

```sh
git clone https://github.com/dheerajponnaganti/thenwise-hub.git
cd thenwise-hub
npm ci
npm test            # unit tests (Vitest)
npm run lint        # ESLint
npm run typecheck   # TypeScript
```

The browser tests start a real team server, so they need a clone of [thenwise](https://github.com/dheerajponnaganti/thenwise) next to this one:

```sh
npx playwright install chromium
THENWISE_SRC=../thenwise npm run e2e
```

`npm run dev` serves the Hub on port 5173 and proxies `/v1` to a team server on port 4170. `/catalog` shows every component in both themes.

## Where things live

| Folder | What it holds |
| --- | --- |
| `src/pages` | One file per screen |
| `src/catalog` | The shared components: cards, stamps, ledgers, volumes |
| `src/api` | The API client and the types generated from `api/openapi.json` |
| `src/fonts` | The fonts and their licences |
| `e2e` | Playwright tests against a real server |

## Pull requests

- One change per pull request, with a test that fails without it.
- `npm test`, `npm run lint` and `npm run typecheck` pass, and `npm run e2e` for a change on a screen.
- Every screen works on a phone and in both themes, with no horizontal scroll.
- The API types come from `api/openapi.json`. Run `npm run gen:types` after you copy a new spec from thenwise; never edit `src/api/types.ts` by hand.
- Add a line to `CHANGELOG.md` under the next version.
- Write short, plain sentences in the UI and the docs.

By sending a pull request, you agree that your contribution is licensed under the MIT licence in [LICENSE](LICENSE).
