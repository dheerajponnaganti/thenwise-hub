# Thenwise Hub agent guide

Thenwise Hub is the web console for Thenwise Teams: a React app that reads a team server's API. It holds no data of its own. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## If you are an AI agent

A person reviews and owns every line you write. Do not open a pull request, issue or comment without your operator's approval.

## Commands

- `npm ci`: install.
- `npm run dev`: run the app.
- `npm run lint`, `npm run typecheck`, `npm test`: the checks to run before every pull request.
- `npm run e2e`: browser tests against a real server. Run them for any change on a screen. They need `THENWISE_SRC` set to a thenwise checkout.
- `npm run gen:types`: regenerate the API types after copying a new spec into `api/openapi.json`.

## Rules that must hold

- NEVER edit generated API types by hand.
- ALWAYS keep every screen working on a phone and in both themes, with no horizontal scroll.
- Add a test that fails without your change.

## Pull requests

- One change per pull request.
- Title: `type(area): what changed`, such as `fix(catalog): keep the card width`. Types are fix, feat, docs, test, ci, chore, refactor and perf. CI checks the form.
- A change users will notice adds a line to `CHANGELOG.md`.
- Pull requests are squash merged, so write the title and description for a public history.
