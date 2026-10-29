# Changelog

## 0.4.2 Interlibrary loan

- README: the first screen says what the Hub is and runs it in three lines.
- CI runs the browser tests against thenwise 0.1.23.
- A Hub on another host: build with `VITE_THENWISE_API` set to the server's address, and the Hub signs in, stays signed in across reloads, and writes through a server started with `--allow-origin`. It needs thenwise with `GET /v1/session/csrf`.
- The export link follows the server's address too.

## 0.4.1 Open stacks

- Thenwise Hub is open source under MIT, with issue forms, a contributing guide, a security policy and a code of conduct. Questions go to Thenwise Discussions.
- README: live release and CI badges, and a "Join the reading room" section on the ways to help.
- CI runs the browser tests against a real thenwise 0.1.20 server.
- The members ledger test counts the Shares column.

## 0.4.0 The stacks

- Shared chats are bound volumes. The project drawer gains a Chats tab: the owner's slip, the date, the first prompt as the spine label and the leaf count.
- A volume opens as leaves, one card per turn. The prompt is the heading, the reply is the body, dead ends are stamped ABANDONED, and paths and commits are footnotes. Reply text is always shown as text.
- Search gains a Chats tab. Each volume shows the server's snippet, and a click lands on the leaf.
- My shares for members and up: the projects you share with counts and sizes, your own volumes under each, Unshare for a project or a volume, and Pause or Resume for a project. Paused projects carry a PAUSED stamp.
- Members gets a Shares column. Admins get a sharing ledger with Pause, Resume and Unshare.
- An abandoned leaf shows the dead end in its own words.
- The nav stays on one line; My shares is linked from My notes.
- README: a new plate, the stacks, and the promise "Chats stay home unless you share a project. Raw transcripts never travel."
- Settings gets chat retention.
- On a phone a volume is a vertical stack of cards, with the spine label pinned at the top.
- Needs thenwise 0.1.17 (Teams API 1.1). Against an older server the chat screens stay away.

## 0.3.1 Fixes and a README

- The nav fits one line on a desktop again; Sign out had wrapped onto a line of its own.
- A history line reads "20 OCT 2026 · REV 12"; the date and REV had run together.
- A README with four plates built from real screenshots: the hero, a tour, day and night, and where the Hub fits.

## 0.3.0 Stamp tray

- The stamp tray on a card for editors and up: DECIDED, ABANDONED, RETIRED, SUPERSEDED BY, PINNED, tags and edit.
- Edits hold the revision they started from. A second editor who saves first causes a conflict card with a line diff and "Take mine over it".
- Circulation history: every revision as a dated line, openable, with "restore this" (it writes a new revision).
- The supersede slip: search for the newer card, with plain reasons when a card cannot replace itself or is pending. It sits at the bottom of a phone screen.
- Pending tray for admins when the review queue is on: approve or refuse.
- Start here on Home lists pinned cards. Projects gain a Timeline tab of decisions and dead ends.

## 0.2.0 Circulation desk

- Members: a ruled ledger with role stamps, expiry, last seen and removed rows struck through. Invite by link, change role, set expiry, rotate a token, remove while keeping or pulling their cards.
- Secrets (invite links, new tokens) show once on a slip with copy and "I have saved it".
- Settings: team name, review queue, export as a zip.
- Activity: the audit log as dated lines with filters for who and action, plus the most-read cards.
- Admins approve a pending card from its note page.
- Role-aware navigation. Viewers see no stamp actions and no My notes. Others who open an admin page get a one-card "Librarians only" page.
- The ledger becomes one card per member on a phone.

## 0.1.0 Reading room

- Sign in with a token or an invite link, and keep your token once.
- Home: the cabinet (a drawer per project), a start-here tray, the search slip, the newest cards.
- Search with highlighted hits and filters for kind, project, owner and date.
- The note card: call number, date stamp, kind and status stamps, borrower's slip, footnotes, copy link. Markdown is shown as text, never as HTML.
- Project drawers with month tabs. My notes with unshare.
- The Card Catalog design system in `src/catalog/`, light and dark, self-hosted fonts, reduced motion respected, a `/catalog` page.
- Typed API client generated from the frozen v1 spec, with a build check.
