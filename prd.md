# Kids Rewards Manager — Product Requirements Document

## Overview

A simple, customizable family web app that helps parents motivate kids by
tracking and rewarding their actions, achievements, and outputs through points
and badges.

## Problem

Parents struggle to consistently recognize and reinforce positive behavior.
Existing apps are overly complex, poorly customizable, or don't support
multiple caregivers managing the same children.

## Goals

- Give parents a frictionless way to define custom actions worth rewarding
- Let kids earn points and unlock badges as they complete those actions
- Allow kids to redeem points for pre-defined rewards
- Support multiple kids per family
- Keep everything customizable — categories, point values, badges, rewards

## Non-Goals (v1)

- Native mobile app (planned for v3)
- Server-side backend or multi-device sync (planned for v2)
- Multi-parent / multi-device support (planned for v2)
- Social / sharing features
- AI-generated suggestions (planned for v3)
- Recurring actions / streaks (planned for v2)
- Data backup / export (planned for v2)

---

## Users

| Role | Description |
|------|-------------|
| Parent / Guardian | Creates and manages actions, approves reward redemptions, defines rewards |
| Kid | Views their own dashboard, requests reward redemptions |

**Auth model (v1):** Trust-based — no PIN, no accounts. On load, the user
picks a role ("I'm a parent" or "I'm a kid → pick your name"). The session
remembers the role until the user explicitly switches. No access control is
enforced in v1; the separation is a UI convention only.

Multi-parent support (inviting a second caregiver) is out of scope for v1
because there is no backend to sync data across devices. It will arrive in v2
with Supabase.

---

## Target Audience

Primary users of the **kid-facing UI** are children aged **4–8**. The UI must
therefore use:
- Minimal text; icons and imagery carry meaning
- Large tap targets
- Bright, high-saturation accent colors on a warm/light background
- A single prominent metric (point balance) rather than dense dashboards

Parents are the primary users of the management UI. They are comfortable with
standard web-app conventions.

---

## Visual Design Direction

Inspired by **Duolingo / Khan Academy Kids**:
- Rounded, friendly fonts (e.g., Nunito or Fredoka One for headings)
- Warm cream/off-white background; amber and soft-green primary palette
- High-saturation accent colors for interactive elements
- Playful micro-interactions and subtle animations
- Illustrated or emoji-based avatars and badges — no photo uploads

---

## Core Features — MVP

### 1. First Launch & Onboarding

**First launch (no family data exists):**
- Branded landing page: app name, tagline, warm illustration
- Single CTA: "Set up your family →"
- Leads into the setup wizard

**Setup wizard (guided but skippable):**
1. Family name
2. Add first kid (name + avatar)
3. Add first action (name + points value)
4. Done — arrive at parent dashboard
- Each step has a "Skip for now" link; missing items surface as contextual
  prompts inside the app

### 2. Role Selection Screen

Shown on every fresh load (no persisted session) or when user taps "Switch role":

- "I'm a parent" → parent dashboard
- "I'm a kid" → name picker → kid dashboard
- No PIN or password in v1 (trust-based)

### 3. Kid Profiles

- Add multiple kids with name, emoji avatar, and color accent
- Each kid has an independent points balance and badge collection
- Parents can view per-kid activity history

### 4. Actions Catalog

- Parents define custom actions (e.g., "Clean your room", "Read for 20 min")
- Each action includes: name, description, category, points value (1–10 scale),
  optional badge award
- Built-in categories: Chores, Academics, Behavior, Health, Creativity
- Starter templates for common actions (can be customized or deleted)
- Actions can be active or archived
- The same action can be logged multiple times per day (no daily limit)
- No recurring/scheduled actions in v1

### 5. Logging Action Completions (Parent)

Parent can log a completion from **three entry points**:
1. **Floating action button (FAB)** — visible on every screen; opens a modal:
   pick kid → pick action → confirm
2. **Kid profile page** — action list specific to that kid; tap to log
3. **Parent dashboard** — quick-action shortcuts per kid card

Only parents can mark actions as complete. Kids have no self-report flow in v1.

### 6. Points System

- Small-number economy: actions award **1–10 points** each
- Rewards cost **~20–50 points** (configurable per reward)
- Parents can award manual bonus points with a note
- Points history visible to both parents and the kid
- No expiry, no streak multipliers in v1

### 7. Badges

- Parents create badges (emoji icon + name + description)
- Badge triggers: manual award only in v1 (automatic milestones in v2)
- Kids see their badge collection on their dashboard
- Badges are purely visual / honorary — no points value

### 8. Reward Redemption

**Kid flow:**
1. Kid browses reward catalog — all rewards shown; unaffordable ones are greyed
   out with points needed displayed
2. Kid taps an affordable reward → confirmation dialog ("Spend X ⭐ on [Reward]?")
3. Kid confirms → success screen: "Request sent! Ask Mom/Dad to approve 🎉"
4. Points are **not deducted yet** — held pending parent approval

**Parent flow:**
- Badge count on the Approvals nav item shows pending requests
- Parent opens `/parent/approvals`, sees pending requests per kid
- Parent approves → points deducted, kid notified next time they open app
- Parent denies → request dismissed, points unchanged

### 9. Dashboards

**Parent dashboard (`/parent`):**
- Summary card per kid: points balance, recent badge, pending redemption count
- Activity feed: recent completions and pending approvals
- Quick-action shortcuts (log completion per kid)
- FAB for fast action logging

**Kid dashboard (`/kids/[id]`):**
- Kid's name + avatar (large, prominent)
- Points balance: giant bold number + ⭐ icon (easy for young kids to read)
- Badge wall: emoji grid of earned badges
- Rewards section: full catalog, unaffordable items greyed out
- Minimal text; icons and visuals carry the UI

---

## Customization

| Area | What's Customizable |
|------|---------------------|
| Actions | Name, description, category, point value, linked badge |
| Badges | Name, emoji icon, description |
| Rewards | Name, description, points cost, active/inactive |
| Kid profiles | Name, emoji avatar, color accent |
| Categories | Add/rename/remove action categories |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix UI primitives + Tailwind) |
| State / persistence | React Context + localStorage |
| Auth | None (trust-based role selection in v1) |
| Deployment | Vercel |

---

## Data Model (v1 — localStorage)

```
Family       { id, name, createdAt }
Kid          { id, familyId, name, avatar, colorAccent, createdAt }
Category     { id, familyId, name, icon }
Action       { id, familyId, name, description, categoryId, pointsValue,
               badgeId?, isTemplate, isActive }
Badge        { id, familyId, name, icon, description }
Reward       { id, familyId, name, description, pointsCost, isActive }
Transaction  { id, kidId, type ('earn' | 'redeem'), amount, actionId?,
               rewardId?, status ('approved' | 'pending' | 'denied'),
               timestamp, note? }
KidBadge     { kidId, badgeId, awardedAt }
```

Notes:
- No `Parent` entity in v1 (trust-based, no accounts)
- No `joinCode` or multi-parent fields
- `Transaction.status` for earn transactions is always `approved`; for redeem
  transactions it starts `pending` and transitions to `approved` or `denied`

---

## Pages & Routing

```
/                       Role selection screen (or redirect if session active)
/setup                  Family onboarding wizard
/parent                 Parent dashboard (all kids overview)
/parent/actions         Manage actions catalog
/parent/rewards         Manage reward catalog
/parent/badges          Manage badges
/parent/kids            Manage kid profiles
/parent/approvals       Pending redemption requests  [badge count shown in nav]
/kids/[id]              Kid's personal dashboard
```

---

## Navigation

**Bottom tab bar** (mobile-first, shown on all app screens after setup):

- **Parent tabs:** Home | Kids | Actions | Approvals | More
- **Kid tabs:** My Stars | Badges | Rewards

The FAB (floating action button for logging completions) floats above the tab
bar on all parent screens.

Role switching is accessible from the "More" tab or from the home/role-select
screen.

---

## MVP Success Criteria

- [ ] First-launch landing page leads cleanly into setup wizard
- [ ] Parents can create a family and add 2+ kids
- [ ] Parents can define 5+ custom actions across categories
- [ ] Parent can log a completion via FAB, kid profile, and dashboard (all 3 paths)
- [ ] Kids can view their ⭐ balance and badge wall
- [ ] Reward catalog shows all rewards; unaffordable ones greyed out
- [ ] Redemption request → parent approval → points deducted works end-to-end
- [ ] Data persists across browser sessions (localStorage)
- [ ] App is fully usable on a 375px-wide mobile browser (PWA-ready layout)

---

## Roadmap

| Version | Focus |
|---------|-------|
| v1 (current) | Web PWA, localStorage, trust-based auth, core reward loop |
| v2 | Backend (Supabase), multi-device sync, multi-parent, recurring actions, push notifications, data export |
| v3 | Native iOS + Android app, AI-suggested actions, streaks, streak multipliers |

---

## Evaluation Log & Optimization Notes

### Round 1 — Self-evaluation (Feb 2026)

#### Bugs Fixed

**[Bug] Hydration race condition — error page on kid tap**
- **Root cause:** `FamilyContext` hydrates from localStorage asynchronously. On first render, `store` is empty (`DEFAULT_STORE`). Pages that check `if (!kid)` and redirect via `useEffect` would fire the redirect before the data was loaded, causing an error/blank page.
- **Fix:** Added `hydrated: boolean` to `FamilyContext`. All pages that guard on `kid`/`family` existence now wait for `hydrated` before redirecting. Pattern: `if (hydrated && !kid) router.replace(...)` and `if (!hydrated || !kid) return null`.
- **Affected pages:** `/parent`, `/parent/kids/[id]`, `/kids/[id]`, `/kids/[id]/badges`, `/kids/[id]/rewards`.

#### UX Improvements Applied

**[UX] Add kid is a rare action — demoted from primary to secondary**
- Adding a kid happens once per year at most for a conventional family. Previously, a prominent "+ Kid" button sat in the header of the Home page.
- **Fix:** Removed the header button. "+ Add another kid" is now a dashed outline button at the bottom of the kid list — visually quiet but discoverable. The first-run empty state retains a prominent CTA.

**[UX] Single-kid family: FAB should not ask "pick a kid"**
- When there is only one kid, the logging FAB's kid-picker step is pure friction.
- **Fix:** `LogActionFab` detects single-kid families. If only one kid exists, the kid is auto-selected and shown as a read-only header in the modal. The picker dropdown is hidden entirely. Multi-kid families still see the full picker (now rendered as tap-target buttons instead of a select).

**[UX] Actions tab lacked usage context**
- Actions are the core catalog parents build up over time, but there was no signal about which ones were actually being used.
- **Fix:** Added per-action completion count (e.g., `✓ 12×`) computed from the transaction log. Added sort bar: Default | Most used | Category | Stars ↓. Helps parents prune unused actions and surface favorites.

**[UX] Redemption flow was invisible**
- The Rewards tab managed the reward catalog but gave no hint that redemption happened elsewhere (kid's profile page). Users could not discover the redeem path.
- **Fix:** Added a persistent info banner at the top of the Rewards tab explaining *how* redemption works with a direct link to each kid's profile page. Reward cost input changed from a limited slider (5–100) to quick-pick chips + custom number input (matching actions).

**[UX] Rewards cost range was too narrow**
- Actions can now be worth up to 500 stars (for achievements), but rewards were capped at 100 stars via a slider. Inconsistency.
- **Fix:** Rewards now use quick-pick chips (10, 20, 30, 50, 75, 100) plus a custom number input — uncapped, consistent with the actions pattern.

---

### Round 2 — Enhancement Batch (Feb 2026)

#### Requests

1. **Home tab — avatar switcher + embedded kid profile**
2. **Actions tab — quick-log button per action**
3. **Punishment actions — deduct points, color-coded, adjust+reason dialog**
4. **Rewards tab — redemption stats, affordability color, per-kid wishlist**
5. **Remove the floating FAB**

---

#### Design Decisions

**F5 — Remove FAB**
- The FAB (floating "+") was the primary log-action entry point but conflicts with the redesigned home tab (F1) and actions quick-log (F2), which together provide two clearer paths.
- **Decision:** Remove `LogActionFab` from the parent layout entirely. No replacement FAB needed because:
  - Home tab's embedded kid profile provides inline action logging
  - Actions tab provides a "Log" button per action

**F1 — Home Tab: Avatar Switcher + Embedded Kid Profile**
- **Problem:** The home tab showed a list of kid cards (balance + links) with no useful action. Parents had to tap through to a separate page to log anything.
- **Design:**
  - Top of home: a horizontal scrollable row of kid avatars. Tapping one selects that kid (active = highlighted with accent color ring). Defaults to first kid on load.
  - Below the avatar row: the selected kid's full profile view inline — star balance, "Log an action" list, "Redeem a reward" list, recent activity.
  - Kid management (edit/delete) lives in a compact secondary control under each avatar (small pencil icon below avatar). This keeps the primary surface clean.
  - Empty state (no kids): unchanged — prominent "Add a kid" CTA.
  - The `/parent/kids/[id]` deep-link route is retained for compatibility but the home tab is the primary workspace.

**F2 — Actions Tab: Quick Log Button**
- Each active action card gets a "Log" button alongside Edit/Archive.
- Tapping "Log" opens a confirmation dialog (shared with F3's design):
  - Header: kid picker (if multiple kids, shown as avatar buttons; if 1 kid, skip picker)
  - Amount row: default value pre-filled, subtle [−] / [+] buttons for adjustment
  - Reason field: appears only if value was adjusted from default (optional text input)
  - CTA: "Award X ⭐ to [Kid]" or "Deduct X ⭐ from [Kid]" (if punishment action)
- Archived actions are not shown in the active list, so no log button needed there.

**F3 — Punishment Actions**
- **Data model changes:**
  - `Action`: add `isDeduction: boolean` (default `false`)
  - `Transaction.type`: expand from `'earn' | 'redeem'` to `'earn' | 'redeem' | 'deduct'`
  - `Transaction`: add `reason?: string` (recorded when amount was adjusted or for audit)
  - Balance calculation: `earn → +amount`, `redeem → −amount`, `deduct → −amount`
- **UI:**
  - Action form toggle: "⭐ Reward (earn points)" / "⚠️ Punishment (deduct points)"
  - Active actions list: reward actions shown normally (amber/green); punishment actions shown with a red-tinted row and a "−" label.
  - Log confirmation for punishments: red-tinted dialog, "Deduct X ⭐ from [Kid]" CTA with warning color.
  - Balance can go negative (intentional — parent has full control).

**F4 — Rewards Improvements**
- **a. Redemption stats (parent rewards management tab):**
  - Compute per-reward redemption count from transactions (`type === 'redeem' | 'deduct'` with matching `rewardId`).
  - Show "Redeemed N×" badge on each reward card.
  - "Days in a row" is deferred (requires streak calculation logic; out of scope for this batch).
- **b. Affordability color (kid-facing views — home tab + /kids/[id]/rewards):**
  - Rewards the selected kid can currently afford: amber/green highlight border.
  - Unaffordable: normal (slightly dimmed). This replaces the current `opacity-55` approach.
- **c. Per-kid Wishlist (kid-facing views):**
  - **Data model:** `Kid` gains optional `wishlist?: string[]` (array of reward IDs, max 3).
  - Context adds `addToWishlist(kidId, rewardId)` and `removeFromWishlist(kidId, rewardId)`.
  - Reducer: reuse `UPDATE_KID` action (update kid's wishlist array).
  - **Wishlist UI (kid-facing reward view):**
    - If any wishes exist, a "My Wishlist" section renders at the top.
    - Each wished reward shows: name, cost, progress bar (current stars / cost), and "Remove" link.
    - Rewards section below: unaffordable rewards that are not yet wishlisted show "+ Add to wishlist" (disabled if 3 wishes already active).
    - When a kid redeems a wishlisted reward, the app auto-removes it from the wishlist.
  - Wishlist data is stored on the `Kid` entity in localStorage — persists across sessions.

---

#### Updated Data Model

```
Action       { id, familyId, name, description, categoryId, pointsValue,
               isDeduction, badgeId?, isTemplate, isActive }
Transaction  { id, kidId, type ('earn' | 'redeem' | 'deduct'), amount,
               actionId?, rewardId?, status, timestamp, note?, reason? }
Kid          { id, familyId, name, avatar, colorAccent, createdAt,
               wishlist? }
```

---

#### Implementation Order

| # | Feature | Scope |
|---|---------|-------|
| F5 | Remove FAB | 1 file — layout only |
| F1 | Home tab redesign | Rewrite parent/page.tsx |
| F2 | Actions quick-log | Add log dialog to actions page |
| F3 | Punishment actions | Data model + actions form + log dialog |
| F4 | Rewards improvements | Data model + rewards page + kid rewards view |

Each feature is built and manually verified before the next begins.

---

---

### Round 3 — Focus Group Feedback (Mar 2026)

Feedback collected from a parent focus group (primary users: mothers of children aged 4–8).
Original feedback in Chinese; interpreted and prioritised below.

---

#### FB-1 · Transaction Undo / Delete  *(High priority)*

> "If you accidentally add the wrong stars, you should be able to immediately swipe to delete or undo, instead of having to select a deduction to offset it."

**Problem:** Mistakes happen in real-time, often with a child watching. The current workaround — creating a deduction transaction — is confusing, leaves a messy history, and adds friction at an emotionally charged moment.

**Requirements:**
- Each transaction in the activity feed shows a delete/undo affordance (e.g., swipe-to-dismiss or a trash icon).
- Undo window: 60 seconds after logging, a prominent toast appears: "⭐ +5 logged — Undo". After 60 s the option disappears.
- Hard delete (swipe or tap trash on history view) is available for any transaction regardless of age, with a single confirmation tap.
- Deleting a `redeem` transaction refunds the stars to the kid's balance.
- Deleting a `deduct` transaction restores the stars.

---

#### FB-2 · Chinese (Simplified) Localisation  *(Medium priority)*

> "Is there a Chinese version?"

**Requirements:**
- All visible UI strings are extracted into a locale file (`en.ts` / `zh-CN.ts`).
- Language is set once in family settings; stored in `AppMeta` (not `AppStore` so it survives data resets).
- Default language: auto-detect from `navigator.language`; fallback to English.
- In-scope for v1.x: all parent-facing strings and the kid dashboard. Onboarding wizard included.
- Out-of-scope: RTL layouts (no RTL languages planned).

**Implementation note:** Use a lightweight custom i18n hook (`useT()`) that reads from a locale dictionary; avoid heavy libraries like `next-intl` for v1.x.

---

#### FB-3 · Action Form — Remove Mandatory Category  *(High priority)*

> "The action creation form shouldn't block submission until a category is selected — it feels coercive. When moms are adding or deducting stars they may be in an emotional state; if the app is hard to use it gets deleted immediately."

**Problem:** The current form requires a category before the action can be saved. Category is a secondary organisational concern; the action name and point value are what actually matter.

**Requirements:**
- Category becomes **optional** on the action form. An action can be saved with name + points alone.
- If category is omitted, actions are grouped under an implicit "Uncategorised" bucket in list views.
- The category picker is visually de-emphasised (smaller, below the main fields) rather than appearing as a blocking gate.
- The existing preset chips for point values (1, 3, 5, 10 …) remain, but the **custom number input is always visible and editable** — it is the canonical field. Chips are shortcuts that pre-fill the input.
- Autocomplete on the name field must not suppress the first character typed (if it does, disable autocomplete on that input).

---

#### FB-4 · Weekly / Monthly Analytics Report  *(Medium priority)*

> "It would be great to have a weekly and monthly summary table showing overall performance, with daily and monthly total star data."

**Requirements:**
- New route: `/parent/report` (accessible from the More tab as "📊 Reports").
- Two views selectable via a toggle: **This Week** / **This Month**.
- **This Week view:**
  - Bar chart or table with one row/column per day (Mon–Sun); each cell shows net stars earned that day.
  - Summary row: total stars earned, total deducted, net change, rewards redeemed.
- **This Month view:**
  - Same layout but one row per week of the month.
  - Per-day detail is accessible by tapping a week row (expand inline).
- Per-kid filter: defaults to "All kids"; a chip row above the table lets parents filter to one kid.
- No external charting library in v1.x — render as a simple HTML table with inline bar visualisation using `div` widths (consistent with existing no-dep approach).
- Data is computed entirely from `store.transactions` — no new data model fields needed.

---

#### FB-5 · Quick-Action Home Page  *(High priority)*

> "The first page should have simple, prominent buttons to add or deduct stars. Tapping one pops up a modal to optionally enter a reason. If you don't want a reason, you can add/deduct directly."

**Problem:** The current home tab is an activity feed / overview. Parents who open the app specifically to log something have to navigate to Actions or a kid's profile first. In emotional moments this extra tap causes drop-off.

**Requirements:**
- The **first tab** (Home) becomes a **Quick Log** surface, not an overview feed.
- Layout:
  1. Kid selector row at the top (compact horizontal chips — same as current balance chips).
  2. Two large prominent buttons: **"+ Add Stars"** (amber/green) and **"− Deduct Stars"** (red/rose).
  3. Tapping either opens a bottom sheet with: amount selector (default 5), optional reason text field ("What happened?"), and a confirm button. Reason is never mandatory.
  4. Below the quick-log buttons: the existing date-grouped activity feed (keep for context).
- The existing Getting Started guide card stays between the kid chips and the quick buttons when active.
- The overview dashboard behaviour moves to a secondary view (e.g., a "Summary" entry in More tab or a scrollable section below the feed).

---

#### FB-6 · Motivational Micro-copy on Star Events  *(Medium priority)*

> "When adding stars the confetti is great. When deducting stars it could say something like 'Stand your ground, better next time' to comfort and encourage moms."

**Requirements:**
- **On earn/add:** keep existing confetti burst. Optionally append a short random encouragement to the flash toast (e.g., "Keep it up! 🌟", "You're doing great! ⭐").
- **On deduct:** replace the plain flash toast with a warmer message. Pick randomly from a set of short, validating phrases shown in the toast, e.g.:
  - "坚持立场，下次更好 💪" / "Stand your ground — better next time 💪"
  - "Setting boundaries is love ❤️"
  - "Consistency is key 🔑"
  - "You've got this, keep going 🌈"
- Phrases stored in a locale-keyed map (feeds into FB-2 Chinese localisation naturally).
- No confetti on deduction — the visual language should feel firm but warm, not celebratory.

---

#### FB-7 · Action Form — Free-Form Input & First-Character Bug  *(High priority)*

> "Adding a new action is awkward: you can't change the first letter, and you can only select from the numbers above."

**Two distinct problems:**

**a) First-character input bug:**
- The action name input may have `autocomplete` or browser-native autofill interfering with the first keystroke.
- Fix: add `autoComplete="off"` and `autoCorrect="off"` to the name `<input>`. Verify that `autoFocus` does not conflict with IME (input method editors) for Chinese keyboards.

**b) Point value selector feels locked to presets:**
- The chip row (1, 3, 5, 10, 25, 50, 100) reads as the only valid options.
- Fix: ensure the custom `<input type="number">` below the chips is prominent (same visual weight as chips), always editable, and clearly labelled "or enter any value". The chips simply prefill it as shortcuts.

---

#### Priority Matrix (Round 3)

| ID | Feature | Priority | Effort | Target |
|----|---------|----------|--------|--------|
| FB-1 | Transaction undo / delete | High | M | v1.1 |
| FB-3 | Remove mandatory category | High | S | v1.1 |
| FB-5 | Quick-action home page | High | M | v1.1 |
| FB-7 | Action form input fixes | High | S | v1.1 |
| FB-6 | Motivational micro-copy | Medium | S | v1.1 |
| FB-4 | Weekly/monthly report | Medium | M | v1.2 |
| FB-2 | Chinese localisation | Medium | L | v1.2 |

---

#### Observations for Future Iterations (v1.x / v2)

- **Kid dashboard (/kids/[id]):** The recent activity feed only shows 5 entries and displays generic emoji (⭐/🎁). Enhance with category-specific icons and a "See all" link.
- **First launch UX:** After setup wizard completes, user lands on parent dashboard with no guidance about next steps. A one-time "tips" banner (log your first action → set up rewards → redeem) would reduce drop-off.
- **Action logging confirmation:** Currently shows a toast. For young kids watching over parent's shoulder, a more celebratory flash (animation, confetti) would reinforce the reward moment.
- **Empty Actions tab:** When no actions exist, the empty state should link directly to the setup wizard's action step rather than just saying "Add one!".
- **Navigation clarity:** "More" tab is a catch-all. As the app grows, Badges and History should graduate to their own tabs or be surfaced more prominently (e.g., per-kid badges visible on the kid card).
- **Redeem section on kid profile:** Label "Redeem a reward" is parent-centric but clear. Consider also showing the kid's recent redemption history inline so parents can track what was given.
- **Points economy calibration:** With actions supporting 1–500 stars and rewards supporting custom costs, families need guidance on balancing the economy. A setup nudge ("typical actions: 3–10 stars; typical rewards: 20–50 stars") would help first-time parents.
- **LogActionFab on kid detail page:** The FAB is redundant when already on a kid's page that has an inline action list. Consider hiding FAB on `/parent/kids/[id]` to reduce visual clutter.

---

### Round 4 — Parent User Feedback (Mar 2026)

Feedback collected from a parent user after v1.1 shipped.
Original feedback in Chinese; translated and interpreted below.

---

#### FB-8 · Direct Number Input for Star Amount  *(High priority)*

> "加星星的数字之前那种形式可以，只要可以把第一个数也可以改就行，总的来说要可以直接录入数字是最方便的"
> ("The previous stepper form is fine, just need to be able to change the first digit too. Overall, being able to directly enter a number is most convenient.")

**Problem:** The current star-amount stepper in the earn/deduct sheet shows a read-only number display. Users cannot tap the number and type directly — they must tap +/− repeatedly to reach their target, which is slow for large values.

**Requirements:**
- Replace the read-only number display with `<input type="number">` that is always directly editable.
- The +/− stepper buttons remain as convenience shortcuts (increment/decrement by 1).
- Input is pre-filled with a sensible default (e.g., the action's `pointsValue` when an action is selected, otherwise 1).
- Min value: 1. No upper cap enforced in UI (parent has full control).
- On mobile, tapping the input should open a numeric keyboard (`inputMode="numeric"`).
- Applies everywhere a star amount is entered: earn sheet, deduct sheet, bonus-points dialog.

---

#### FB-9 · Home Page — Per-Kid Cards with Inline Action Sheets  *(High priority)*

> "主页直接显示人名，星星数，和 add，deduct，redeem 摁钮，然后进入具体事件和编辑星星的界面，custom 星星和事件摁钮要放在 top，接下来再是历史事件"
> ("The home page should directly show each kid's name, star balance, and Add/Deduct/Redeem buttons. Tapping one enters a specific event and star-editing interface where custom star input and event buttons are at the top, followed by history events.")

**Problem:** The current home page uses global Add/Deduct/Redeem buttons that require a kid-picker step inside the sheet. Users want per-kid buttons on the home page itself so the action is pre-contextualised — no extra selection step.

**Design:**

*Home page layout (replaces current kid chips + global buttons):*
- One card per kid, showing: avatar + name + current star balance + three inline buttons (⭐ Add, ⚠️ Deduct, 🎁 Redeem).
- Cards are full-width, stacked vertically — no horizontal scroll.
- Tapping any button opens a **tall bottom sheet (~85% screen height)**, pre-locked to that kid. No kid picker inside the sheet.

*Per-kid bottom sheet layout (Add / Deduct modes):*
1. **Header:** kid avatar + name + mode label (e.g., "Add Stars for Mia") + close button.
2. **Action section (top):**
   - Direct number input (see FB-8) — typeable, with +/− buttons.
   - Event buttons: tap-target grid of active actions (earn or deduction actions depending on mode). Tapping an action pre-fills the amount with that action's `pointsValue` and records the `actionId` on the transaction.
   - "Custom (no event)" option always available for free-form amount entry without linking to a specific action.
   - Optional reason text field (shown when no event is selected, or always visible in Deduct mode).
3. **Confirm button:** "Award X ⭐ to [Kid]" or "Deduct X ⭐ from [Kid]".
4. **Transaction history (below the fold, scrollable):** last N transactions for this kid, so the parent can see context while logging.

*Per-kid bottom sheet layout (Redeem mode):*
1. **Header:** kid avatar + name + "Redeem for [Kid]" + close button.
2. **Reward list:** all active rewards shown as tap targets. Rewards the kid cannot afford are dimmed but tappable (parent override allowed). Tapping a reward opens a **confirm dialog** showing reward name, default cost, and an optional amount adjustment input.
3. Confirm → deducts stars and logs `type: 'redeem'` transaction.

**What this replaces:**
- The current global quick-action buttons + kid-picker inside the sheet (from FB-5/v1.1) are removed.
- The horizontal kid-balance chip row is replaced by the per-kid card layout.
- Getting Started guide card (if active) remains at the top of the home page, above the kid cards.
- Activity feed (date-grouped, all kids) remains below the kid cards as secondary context.

---

#### Priority Matrix (Round 4)

| ID | Feature | Priority | Effort | Target |
|----|---------|----------|--------|--------|
| FB-8 | Direct number input | High | S | v1.2 |
| FB-9 | Home page per-kid layout | High | M | v1.2 |
