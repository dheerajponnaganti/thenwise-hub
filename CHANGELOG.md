# Changelog

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
