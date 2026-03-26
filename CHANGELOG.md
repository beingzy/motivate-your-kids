# Changelog

All notable changes to **Motivate Kids** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.2.2] — 2026-03-26

### Added
- Invite page `/invite/[familyCode]/[relationship]` — public route for accepting invite links; pre-fills invitee name from `?name=` param; error states for expired/cross-device links
- Clickable avatars in Settings: My Profile, kid cards, and member cards all show a pencil badge and open the avatar picker on tap
- Avatar picker opens directly to the correct tab (Presets if current avatar is a preset)

### Changed
- Invite URLs now use path format `/invite/{familyCode}/{role}` instead of `?token=` query params
- `/invite` added to middleware public routes (no auth required to view)

### Fixed
- Remove member in Settings now shows a proper in-app confirmation bottom sheet instead of `window.confirm()`

---

## [0.2.1] — 2026-03-26

### Fixed
- Members tab: family code card always visible (falls back to `uid` when `displayCode` is absent)
- Members tab: removed direct "Add Member" form — members now join exclusively via invite links
- Invite modal: added optional invitee name field that pre-fills `?name=` in the generated URL

---

## [0.2.0] — 2026-03-25

### Added
- Tabbed Settings page consolidating Members, Profiles, Badges, and History into one view
- Members tab: family invite links with role selection, invite approval flow, ownership transfer
- Members tab: join-by-code flow with pending request approval
- Profiles tab: kid profile editing (avatar, frame, color, birthday, gender, hobbies, wishlist)
- Profiles tab: parent profile editing with profile-change request / approval system
- Badges tab: create / edit / delete badges, award badges to kids
- History tab: transaction log with type filter (All / Earned / Deducted / Redeemed) and per-kid filter
- Vercel Web Analytics integration
- Family UID displayed as human-readable code (`displayCode`) for sharing
- Monorepo scaffolding (pnpm workspaces + Turborepo) for future mobile app

### Changed
- Settings navigation item now routes to `/parent/settings` (was `/parent/more`)
- `/parent/more` redirects to `/parent/settings`

### Fixed
- Avatar / birthday / gender / role editing for parent family members
- Auth callback session loss on email OTP verification
- `.gitignore` updated to exclude nested `node_modules` directories

---

## [0.1.0] — 2026-03-01

### Added
- Email + password sign-up with OTP email verification
- Family creation flow on first sign-in
- Kid management (add, edit, remove) with emoji avatars and color accents
- Action logging with photo and voice memo attachments
- Points / rewards system with wishlist (max 3 items per kid)
- Redemption flow with parent approval
- Badge system with automatic and manual award
- Daily points bar chart on parent dashboard
- Avatar frames (stars, crown, rainbow, etc.)
- Confetti animation on points earn
- PWA support with iOS Add to Home Screen
- Getting-started guide with version-gated onboarding cache
- Full i18n support (English / Chinese)
- Jest test suite (64 tests)
