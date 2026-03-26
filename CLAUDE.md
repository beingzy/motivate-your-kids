# CLAUDE.md — Project Instructions

> This file applies to the **motivate-kids** repository.
> Global preferences live in `~/CLAUDE.md`.

---

## Branching & Release Strategy

**`main` is the production branch.** It is deployed to Vercel on every push.

- **Never commit directly to `main`.**
- All work — features, fixes, chores — must happen on a dedicated branch.
- Branch naming convention:
  - `feat/<short-description>` — new features
  - `fix/<short-description>` — bug fixes
  - `chore/<short-description>` — dependency updates, config, tooling
  - `refactor/<short-description>` — code restructuring with no behaviour change
  - `docs/<short-description>` — documentation only

### Workflow for Every Change

1. Branch off `main`: `git checkout -b feat/<name> main`
2. Implement the change following the one-feature-at-a-time rule (see `~/CLAUDE.md`)
3. Run lint + type-check + tests — all must pass
4. Open a PR targeting `main`
5. Squash-merge the PR; delete the feature branch after merge

---

## Versioning & Changelog

This project follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

| Bump | When |
|------|------|
| `PATCH` (0.2.**x**) | Bug fixes, small UX tweaks, copy changes |
| `MINOR` (0.**x**.0) | New features, new pages, new user-facing capabilities |
| `MAJOR` (**x**.0.0) | Breaking changes, full rewrites, platform migrations |

### On every release

1. Update `version` in `package.json`
2. Add a new entry at the top of `CHANGELOG.md` (newest first)
3. Commit: `chore: release vX.Y.Z`
4. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`

### CHANGELOG.md format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/):

```markdown
## [X.Y.Z] — YYYY-MM-DD
### Added
- ...
### Fixed
- ...
### Changed
- ...
### Removed
- ...
```

---

## Tech Stack Quick Reference

- **Framework:** Next.js 14 App Router (TypeScript)
- **Styling:** Tailwind CSS (warm theme defined in `tailwind.config.ts`)
- **State:** React Context + `localStorage` via `FamilyContext`
- **Auth:** Supabase Auth (email + OTP), app data is client-side only
- **Deployment:** Vercel (auto-deploys on push to `main`)
- **Testing:** Jest + React Testing Library

---

## Key Files

| Path | Purpose |
|------|---------|
| `app/parent/settings/page.tsx` | Tabbed Settings page (Members, Profiles, Badges, History) |
| `context/FamilyContext.tsx` | Global state + all data mutations |
| `lib/store.ts` | localStorage read/write helpers |
| `types/index.ts` | All domain types |
| `lib/i18n.ts` | Translations (en / zh) |
| `prd.md` | Product requirements & build queue |
| `CHANGELOG.md` | Version history |
