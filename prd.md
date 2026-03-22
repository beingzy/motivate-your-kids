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

---

### Round 5 — Backend & Invite System (Mar 2026)

#### Infrastructure Upgrade

Migrate from localStorage-only to a full backend stack:

| Layer | Choice |
|-------|--------|
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Email | Resend |
| Deployment | Vercel |

#### FB-10 · Invite Family Member *(High priority)*

**Requirements:**
- First parent (family owner) can create invite links from Settings > Family Members.
- Invite link contains a unique token and expires after **24 hours**.
- Invite can optionally include an email address — if provided, an invite email is sent via Resend.
- Invitee opens link → signs up / logs in → configures their **role** (relationship to kids).
- Available relationships: Mother, Father, Grandma, Grandpa, Aunt, Uncle, Other.
- Invited members get full parent-level access (same CRUD as owner) once accepted.
- Settings page shows current family members and pending invites.

**Data model additions:**
```
FamilyMember  { id, familyId, userId, email, displayName, relationship, isOwner, joinedAt }
Invite        { id, familyId, invitedBy, email?, token, relationship, status, createdAt, expiresAt, acceptedAt? }
```

**New routes:**
- `/login` — Email/password login
- `/signup` — Account creation
- `/invite?token=xxx` — Accept invite flow (auth → role config → join)
- `/api/invite` — Create invite (POST) / validate invite (GET)
- `/api/invite/accept` — Accept invite (POST)
- `/auth/callback` — Supabase auth code exchange

**Auth methods:**
- **Google OAuth** — primary, lowest-friction sign-in. Uses `supabase.auth.signInWithOAuth({ provider: 'google' })`. Supabase auto-creates the account on first Google login.
- **Email/password** — fallback for users without Google accounts. Requires email confirmation via Supabase Auth.
- Both methods share the same `/auth/callback` route for code exchange.

**Prerequisites (Supabase dashboard):**
- Enable Google provider in Auth > Providers > Google
- Add Google OAuth client ID + secret from Google Cloud Console
- Add production URL to Auth > URL Configuration > Redirect URLs

**RLS policies:** All data tables scoped to family membership via `user_family_ids()` helper function.

---

### Round 6 — Focus Group Distribution Readiness (Mar 2026)

Preparing the app for external distribution to the parent focus group. Covers auth UX improvements, family member management, richer profile avatars, and sensory feedback.

---

#### FB-11 · Auth Enhancement: OTP + Magic Link  *(High priority)*

> Lower the sign-up/sign-in friction — especially for invited family members who may not want to create a password.

**Requirements:**

**a) Sign-in with email OTP (login page):**
- Login page adds a tab/toggle: "Password" | "Email Code".
- Email code mode: user enters email → taps "Send Code" → receives 6-digit OTP via email → enters code → authenticated.
- Uses `supabase.auth.signInWithOtp({ email })` and `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
- Falls back gracefully if Supabase OTP is not enabled (shows error message).

**b) Sign-up with magic link (signup page):**
- Signup page adds a "Sign up with magic link" option below the password form.
- User enters name + email → taps "Send Magic Link" → receives email with login link → clicks link → account created.
- Uses `supabase.auth.signInWithOtp({ email, options: { data: { display_name }, emailRedirectTo: '/auth/callback' } })`.
- Success screen shows "Check your email for a magic link!" message.

**c) Invite flow magic link:**
- Invite page auth step adds magic link signup as an option alongside password-based signup.
- Lower friction path for invited users: just enter email → get link → click → join family.

---

#### FB-12 · Family Member Management UI  *(High priority)*

> Parents need to see who is in their family and invite new members — currently there is no UI for this in settings.

**Requirements:**
- Settings page gains a "Family Members" section (fetched from Supabase `family_members` table).
- Shows current members: avatar + name + relationship label (e.g., "👩 Sarah — Mom").
- Shows pending invites with expiry countdown and email.
- "Invite Member" button opens inline form: email input + relationship picker (reuses the emoji grid from invite page).
- Invite creation calls existing `POST /api/invite` endpoint.
- Owner badge shown on the family owner's row.
- Members can see other members but cannot remove them in v1 (owner-only action, deferred).

---

#### FB-13 · Profile Avatars: Presets + Photo Upload  *(High priority)*

> Replace emoji-only avatars with richer options: preset illustrated avatars and photo uploads with crop/compression.

**Requirements:**

**a) Preset avatars:**
- SVG avatar images stored in `/public/avatars/presets/` (user will supply from Figma).
- Placeholder set of 12 default presets included for scaffolding.
- Avatar picker shows a grid of circular preset images alongside the existing emoji grid.

**b) Photo upload with crop:**
- Camera/gallery file picker → client-side circular crop (1:1 aspect ratio, `react-easy-crop`) → client-side compression (max 200KB, WebP where supported, via `browser-image-compression`) → upload to Supabase Storage `avatars` bucket → public URL stored as avatar value.
- Crop UI: modal overlay with pinch/zoom support, "Save" / "Cancel" buttons.

**c) Avatar data model:**
- Avatar field supports three formats (backwards compatible):
  - Emoji: `"🧒"` (single/double char, existing)
  - Preset: `"preset:avatar-01"` (new)
  - URL: `"https://..."` (uploaded photo, new)
- `AvatarDisplay` component renders any format as a circular image.
- `AvatarPicker` component provides tabbed UI: Emoji | Presets | Upload.

**d) Applies to:**
- Kid profiles (create + edit)
- Family member profiles (invite configure step + settings)

**Dependencies:**
- `react-easy-crop` — client-side image cropping
- `browser-image-compression` — client-side image compression
- Supabase Storage bucket: `avatars` (public, authenticated upload)

---

#### FB-14 · Animation & Sound Effects  *(Medium priority)*

> Add sensory feedback to key actions — makes the app feel alive for kids and satisfying for parents.

**Requirements:**

**a) Sound effects (Web Audio API synthesis — zero external files):**
- Earn stars: ascending major arpeggio chime (happy, bright)
- Deduct stars: soft descending minor tone (firm but gentle)
- Redeem reward: celebratory bell / cash register
- Confirm button: subtle click
- Sounds play alongside existing confetti on earn events.

**b) Sound settings:**
- `AppMeta` gains `soundEnabled: boolean` (default `true`).
- Toggle in Settings page: "🔊 Sound Effects" on/off.
- Respects device silent mode where detectable.

**c) Enhanced animations:**
- Star count bounce on value change (CSS scale keyframe).
- Card entrance staggered slide-up animation on page load.
- Button press scale feedback (`active:scale-95` already used; extend to more buttons).
- Toast slide-in from top / slide-out transitions.
- Bottom sheet slide-up entrance with spring easing.

---

#### Priority Matrix (Round 6)

| ID | Feature | Priority | Effort | Target |
|----|---------|----------|--------|--------|
| FB-11 | Auth: OTP + magic link | High | S | v0.3.0 |
| FB-12 | Family member management UI | High | S | v0.3.0 |
| FB-13 | Profile avatars + photo upload | High | M | v0.3.0 |
| FB-14 | Animation & sound effects | Medium | M | v0.3.0 |

#### Implementation Order

| # | Feature | Scope |
|---|---------|-------|
| 1 | FB-11 | Login + signup + invite pages |
| 2 | FB-12 | Settings page + Supabase queries |
| 3 | FB-13 | New components + Supabase Storage + avatar migration |
| 4 | FB-14 | lib/sounds.ts + CSS animations + settings toggle |

---

### Round 7 — Emotional Engagement & Delight (Mar 2026)

Building deeper emotional connection for kids (ages 4–8) through a virtual companion, richer animation feedback loops, and family avatar decoration effects.

---

#### FB-15 · Virtual Companion (Plant or Animal)  *(High priority)*

> A living creature on the kid dashboard that **grows** as the kid earns stars and **wilts / looks sad** when punishments happen. This gives kids an emotional anchor — they are not just collecting numbers, they are caring for something.

**Concept:**
- Each kid gets a virtual companion displayed prominently on their dashboard.
- The companion has **mood states** driven by recent activity:
  - **Happy / thriving:** Recent earn transactions → companion blooms, bounces, sparkles.
  - **Sad / wilting:** Recent deduct transactions → companion droops, loses color, shows a tear.
  - **Neutral / resting:** No recent activity → calm idle animation.
- The companion **evolves** through growth stages as the kid accumulates lifetime stars:
  - Stage 1 (0–50 stars): Seed / egg / baby
  - Stage 2 (51–200 stars): Sprout / hatchling
  - Stage 3 (201–500 stars): Young plant / juvenile
  - Stage 4 (501–1000 stars): Blooming / adolescent
  - Stage 5 (1001+ stars): Full bloom / adult with decorations
- Growth is based on **lifetime earned stars** (not current balance), so redeeming rewards does not cause regression.

**Companion types (parent chooses during kid setup or kid picks):**
- 🌱 Plant line: seed → sprout → sapling → flowering tree → grand tree with fruit
- 🐣 Animal line: egg → chick → young bird → colorful bird → phoenix-like bird with sparkles
- More types can be added later (ocean creature, dragon, etc.)

**Data model additions:**
```
Kid  { ..., companionType?: 'plant' | 'animal', companionStage?: number }
```
- `companionStage` is computed from lifetime earned stars but cached for performance.
- Mood is computed client-side from the last 3 transactions (no new field needed).

**UI placement:**
- Kid dashboard: companion occupies a prominent card between the star balance and badges section.
- Companion animates continuously (idle loop) with mood-specific variations.
- Tapping the companion triggers a small interaction animation (bounce, hearts, etc.).

**Animation requirements:**
- Each growth stage has a distinct SVG/Lottie illustration.
- Transitions between stages play a celebratory evolution animation.
- Mood changes animate smoothly (e.g., plant wilting over 0.5s, not instant).

---

#### FB-16 · Animation Feedback Loop Enhancement  *(High priority)*

> Animation is the primary language for kids aged 4–8. Every meaningful action should have a visible, delightful reaction — not just a toast message.

**Requirements:**

**a) Earn stars — celebration cascade:**
- Existing confetti + sound retained.
- Add: star count does an exaggerated bounce-scale animation (1.0 → 1.4 → 1.0).
- Add: companion reacts — happy bounce, sparkle particles around it.
- Add: earned amount floats up from the action button as "+5 ⭐" with fade-out.
- Duration: ~1.5s total cascade.

**b) Deduct stars — gentle consequence feedback:**
- Star count shrinks briefly (1.0 → 0.85 → 1.0) with a subtle red flash on the number.
- Companion reacts — droops, single tear drop animation, color desaturation.
- Deducted amount floats down as "−3 ⭐" in muted red with fade-out.
- No confetti, no celebratory sound — the existing soft descending tone plays.
- Duration: ~1.2s.

**c) Redeem reward — achievement moment:**
- Gift emoji burst (🎁) animation around the reward card.
- Star count does a smooth count-down animation (numerically ticking from old to new value).
- Companion does a proud/excited animation.
- Celebratory bell sound plays.

**d) Growth stage evolution — milestone moment:**
- Full-screen overlay with particle effects.
- Old stage fades/shrinks, new stage grows in with spring animation.
- Congratulatory message: "Your [companion] evolved!" with sparkle text.
- Sound: ascending fanfare (new sound, 2s).
- This is the highest-impact animation in the app — should feel like a true achievement.

**e) Badge earned:**
- Badge icon flies from off-screen to the badge wall position.
- Shimmer effect on the new badge for 3s.
- Companion reacts with a happy animation.

**Technical approach:**
- CSS keyframe animations for simple transforms (bounce, scale, fade).
- Framer Motion for orchestrated sequences (earn cascade, evolution overlay).
- Lottie for companion illustrations (lightweight, vector-based, loopable).
- All animations respect `prefers-reduced-motion` media query.

---

#### FB-17 · Family Avatar Decoration Effects  *(Medium priority)*

> Family member avatars (parent and kid) should feel expressive and customizable — decorations and effects make them personal and fun.

**Requirements:**

**a) Avatar frames / borders:**
- Selectable decorative frames around avatars: crown, stars, hearts, flowers, lightning, rainbow ring.
- Frames are SVG overlays rendered on top of the circular avatar.
- Parents choose frames for kids during profile setup; kids can browse and request changes.
- Frames can be earned as rewards (e.g., "unlock the crown frame for 100 ⭐").

**b) Avatar status effects:**
- Animated effects that play on the avatar based on state:
  - Sparkle particles: when the kid recently earned stars (last 30 min).
  - Glow ring: when the kid leveled up their companion recently.
  - Celebration burst: on the home page when the kid's companion just evolved.
- Effects are subtle and non-distracting — small particles, soft glow, no flashing.

**c) Avatar mood indicator:**
- Small emoji overlay on the avatar corner showing companion mood: 😊 (happy), 😢 (sad), 😴 (neutral/idle).
- Synced with companion mood state from FB-15.

**Data model additions:**
```
Kid  { ..., avatarFrame?: string }
```
- `avatarFrame` stores the selected frame ID (e.g., `"crown"`, `"stars"`, `"rainbow"`).
- Status effects and mood indicators are computed client-side — no persistence needed.

**Available frames (v1):**
| ID | Visual | Unlock |
|----|--------|--------|
| `none` | No frame (default) | Free |
| `stars` | Rotating star ring | Free |
| `hearts` | Heart border | 50 ⭐ |
| `crown` | Golden crown on top | 100 ⭐ |
| `flowers` | Floral wreath | 75 ⭐ |
| `rainbow` | Rainbow ring | 150 ⭐ |
| `lightning` | Electric sparks | 200 ⭐ |

---

#### Priority Matrix (Round 7)

| ID | Feature | Priority | Effort | Target |
|----|---------|----------|--------|--------|
| FB-15 | Virtual companion | High | L | v0.4.0 |
| FB-16 | Animation feedback loop | High | M | v0.4.0 |
| FB-17 | Avatar decoration effects | Medium | M | v0.4.0 |

#### Implementation Order

| # | Feature | Scope |
|---|---------|-------|
| 1 | FB-15 | Data model + companion component + dashboard integration |
| 2 | FB-16 | Animation system + earn/deduct/redeem/evolution cascades |
| 3 | FB-17 | Avatar frames + status effects + mood indicator |

#### Design Dependencies

- Companion illustrations (plant stages × moods, animal stages × moods) — need SVG or Lottie assets.
- Avatar frame SVGs — 7 decorative frame designs.
- All visual assets to be designed in the `.pen` design file or sourced from Figma before implementation.

---

### Round 9 — Account Setup & Auth (Mar 2026)

Email + password authentication with OTP email verification and a connected family creation wizard.

---

#### Auth Flow (implemented)

```
/signup              Email + password form (phone tab visible but disabled)
  ↓ signUp()         Supabase creates account, sends confirmation email with OTP
/signup/verify       User enters 6-digit code from email
  ↓ verifyOtp()      Confirms email, signs user in
/                    Role selection (→ /setup if no family data yet)
/setup               Existing family creation wizard (unchanged)
/parent              Parent dashboard
```

Login flow:
```
/login               Email + password → signInWithPassword() → /
```

Middleware enforces auth on all routes except `/login`, `/signup`, `/signup/verify`, `/auth/callback`.

---

#### Supabase Email Template — Required Configuration

For 6-digit OTP codes (instead of magic links), the "Confirm signup" email template in Supabase dashboard must be updated:

**Auth > Email Templates > Confirm signup** — replace the default body with:

```html
<h2>Confirm your email</h2>
<p>Your verification code for Kids Rewards:</p>
<h1 style="letter-spacing: 0.3em; font-size: 2em;">{{ .Token }}</h1>
<p>This code expires in 1 hour.</p>
<p>Or <a href="{{ .ConfirmationURL }}">click here</a> to confirm automatically.</p>
```

The `{{ .Token }}` variable is the 6-digit OTP. The `{{ .ConfirmationURL }}` fallback link redirects to `/auth/callback` which exchanges the code for a session.

**Auth > URL Configuration:**
- Site URL: `https://kids.motivationlabs.ai`
- Redirect URLs: add `https://kids.motivationlabs.ai/auth/callback`

---

#### Pages Built

| Route | Purpose |
|-------|---------|
| `/login` | Email + password sign-in. Error messages are user-friendly (not raw Supabase). Redirect param preserved so users land where they tried to go. |
| `/signup` | Email + password account creation. Phone tab shown but disabled with "Soon" badge. Password must be 8+ chars; confirm field shows red border on mismatch. |
| `/signup/verify` | 6-digit numeric OTP input. Large centered input with letter-spacing for readability. Resend code button. Both verify (`verifyOtp`) and resend (`auth.resend`) wired to Supabase. Magic-link fallback via `/auth/callback`. |
| `/auth/callback` | Server-side route that exchanges Supabase `code` param for a session cookie, then redirects to `/`. |

---

#### Design

- Consistent with app palette: warm cream background (`bg-page`), amber brand colour, Nunito font, rounded-3xl card
- Mobile-first (max-w-sm, full-screen layout)
- OTP input: large text (3xl), letter-spacing 0.4em, numeric keyboard on mobile
- All three pages captured in `tests/auth-screens/` (7 screenshots)

---

### Deployment Decision — Mar 2026

**Live production URL:** https://kids.motivationlabs.ai

**Current live version:** Email + password auth with OTP verification (v1.5)

**What is live:**
- Email + password signup with OTP email verification (Round 9)
- Family creation wizard after first login
- Full star economy (earn / deduct / redeem)
- Avatar system with 30 Figma preset avatars
- Avatar frames (7 tiers, lifetime-star unlocks)
- Animation & sound feedback
- All parent management screens
- Kid dashboards with badges and rewards
- Data stored in localStorage (single device; multi-device sync planned for v2)

**What is deferred:**
- Google OAuth / social login
- Multi-device sync (Supabase DB write-through)
- Invite / family member management
- Photo avatar upload

---

### Round 8 — Supabase Backend Setup (Mar 2026)

The Supabase project **"motivate your kids"** (`vkqzosxjsiyhjltzwpaw`, region: ap-southeast-1) is fully provisioned and schema-ready. The database is the authoritative backend for v2 (multi-device sync). The app currently runs entirely on localStorage (v1); this infrastructure is standing by for the v2 migration.

---

#### Database Schema (live in Supabase)

All tables have RLS enabled. Data is scoped to families via the `user_family_ids()` helper.

| Table | Description |
|-------|-------------|
| `families` | One row per family — `id`, `name`, `created_at` |
| `family_members` | Links `auth.users` to families — `user_id`, `family_id`, `relationship`, `is_owner`, `joined_at` |
| `invites` | 24-hour invite tokens — `token` (unique), `family_id`, `email?`, `relationship`, `status`, `expires_at` |
| `kids` | `id`, `family_id`, `name`, `avatar`, `color_accent`, `wishlist` (text[]), `avatar_frame`, `created_at` |
| `categories` | `id`, `family_id`, `name`, `icon` |
| `actions` | `id`, `family_id`, `name`, `description`, `category_id?`, `points_value`, `is_deduction`, `badge_id?`, `is_template`, `is_active` |
| `badges` | `id`, `family_id`, `name`, `icon`, `description` |
| `rewards` | `id`, `family_id`, `name`, `description`, `points_cost`, `is_active` |
| `transactions` | `id`, `kid_id`, `type` (earn/redeem/deduct), `amount`, `action_id?`, `reward_id?`, `status`, `timestamp`, `note?`, `reason?` |
| `kid_badges` | `(kid_id, badge_id)` composite PK + `awarded_at` |

**Custom types (enums):**
- `transaction_type`: `earn | redeem | deduct`
- `transaction_status`: `approved | pending | denied`
- `member_relationship`: `mother | father | grandma | grandpa | aunt | uncle | other`
- `invite_status`: `pending | accepted | expired`

**RLS policies (all tables):**
- `families`: members can SELECT their family; owners can UPDATE; authenticated users can INSERT (create new family)
- `family_members`: members can SELECT co-members; INSERT own membership; UPDATE own record
- `invites`: anyone can SELECT by token (invite link); family members can INSERT and SELECT; UPDATE on accept
- `kids / categories / actions / badges / rewards`: family members can ALL (CRUD)
- `transactions`: scoped to kids in the user's families — family members can ALL
- `kid_badges`: scoped to kids in the user's families — family members can ALL

**Database functions:**
- `user_family_ids()` — returns `uuid[]` of families the current user belongs to (used in all RLS policies)
- `validate_invite(p_token text)` — validates token, checks expiry, returns invite data
- `accept_invite(p_token text, p_user_id uuid, p_display_name text)` — SECURITY DEFINER; marks invite accepted and inserts `family_members` row

---

#### Storage

**Bucket:** `avatars` (public read)

| Policy | Role | Operation |
|--------|------|-----------|
| Anyone can read avatars | public | SELECT |
| Authenticated users can upload avatars | authenticated | INSERT |
| Authenticated users can update own avatars | authenticated | UPDATE (owner = auth.uid()) |
| Authenticated users can delete own avatars | authenticated | DELETE (owner = auth.uid()) |

---

#### Auth Configuration (to complete before v2 launch)

The following must be configured in the Supabase dashboard before wiring auth into the app:

1. **Google OAuth:**
   - Auth > Providers > Google → enable, paste Client ID + Secret from Google Cloud Console
   - Google Cloud Console: add `https://vkqzosxjsiyhjltzwpaw.supabase.co/auth/v1/callback` as authorized redirect URI
   - Supabase: Auth > URL Configuration → add `https://kids.motivationlabs.ai` to Site URL and Redirect URLs

2. **Email (OTP / magic link):**
   - Auth > Providers > Email → enable "Confirm email" and "Enable email OTP"
   - Auth > Email Templates → customise with brand colours (optional)
   - Set `RESEND_API_KEY` in Vercel env if using custom SMTP via Resend

3. **Vercel environment variables required:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://vkqzosxjsiyhjltzwpaw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase Settings > API>
   RESEND_API_KEY=<Resend API key>
   NEXT_PUBLIC_APP_URL=https://kids.motivationlabs.ai
   ```

---

#### v2 Migration Plan (localStorage → Supabase)

When auth is ready to ship, the migration path is:

1. **Re-add packages:** `@supabase/ssr`, `@supabase/supabase-js`, `resend`
2. **Restore auth pages:** `app/login`, `app/signup`, `app/auth/callback` (from git history: commit `9e19014`)
3. **Restore API routes:** `app/api/invite/*` (from git history)
4. **Restore middleware:** auth enforcement (from git history: commit `9600797`)
5. **Restore settings page** family member management section
6. **Add sync layer:** new `lib/sync.ts` — on sign-in, check if Supabase family exists for user; if not, offer to import from localStorage; if yes, load from Supabase into context
7. **Dual-write period:** write to both localStorage and Supabase simultaneously during migration to avoid data loss
8. **Field mapping** (localStorage camelCase → Supabase snake_case):
   | localStorage | Supabase |
   |---|---|
   | `colorAccent` | `color_accent` |
   | `pointsValue` | `points_value` |
   | `isDeduction` | `is_deduction` |
   | `isTemplate` | `is_template` |
   | `isActive` | `is_active` |
   | `avatarFrame` | `avatar_frame` |
   | `pointsCost` | `points_cost` |
   | `familyId` | `family_id` |
   | `kidId` | `kid_id` |
   | `actionId` | `action_id` |
   | `rewardId` | `reward_id` |
   | `awardedAt` | `awarded_at` |
   | `createdAt` | `created_at` |

---

### Round 10 — Settings, Family Members & Action Memos (Mar 2026)

---

#### FB-14 · Rename "More" Tab to "Settings"  *(Completed)*

**Change:** Bottom nav tab renamed from "More" (☰) to "Settings" (⚙️). i18n updated for en/zh.

---

#### FB-15 · Family Member Management  *(Completed)*

> Parents need to see, add, and manage family members with defined roles and relationships to the kids.

**Requirements:**
- New route: `/parent/family` — accessible from Settings hub.
- Add/edit/remove family members with: name, avatar (emoji or preset), role, and optional birthday.
- **Role constraints:** Mother and Father are single-occupancy (max one each). Grandma, Grandpa, Aunt, Uncle, Nanny, and Other can have multiples.
- **Invite link generation:** Create invite links scoped to a role. Links expire after 24 hours. Copy-to-clipboard support.
- Pending invites displayed with expiry countdown and delete option.

**Data model additions:**
```
FamilyMember   { id, familyId, name, avatar, role, birthday?, createdAt }
FamilyInvite   { id, familyId, token, role, createdAt, expiresAt }
FamilyRole     = 'mother' | 'father' | 'grandma' | 'grandpa' | 'aunt' | 'uncle' | 'nanny' | 'other'
```

**New route:** `/parent/family`

---

#### FB-16 · Action Logging Memos — Photo & Voice  *(Completed)*

> When logging an action, parents can attach a photo and/or a 10-second voice memo as evidence or context.

**Requirements:**
- Quick Log modal (Actions tab + Home page) gains a "Memo (optional)" section with:
  - **Photo capture:** camera/gallery file picker → client-side resize (max 800px) + compress (WebP/JPEG) → stored as base64 data URL in localStorage.
  - **Voice recording:** in-app microphone recording, max 10 seconds, auto-stops at limit. Stored as WebM base64 data URL. Playback/remove controls after recording.
- Memos are stored on the `Transaction` entity (`photoUrl`, `voiceMemoUrl` fields).
- Activity feed shows 📷 and 🎙 indicators on transactions that have attachments.
- No external dependencies — uses native `MediaRecorder` and `Canvas` APIs.

**Data model changes:**
```
Transaction += { photoUrl?: string, voiceMemoUrl?: string }
```

**Files changed:**
- `types/index.ts` — added `FamilyMember`, `FamilyInvite`, `FamilyRole`, memo fields on `Transaction`, updated `AppStore`
- `lib/store.ts` — updated `DEFAULT_STORE`
- `context/FamilyContext.tsx` — added family member CRUD + invite methods, updated `logCompletion` signature
- `components/ParentNav.tsx` — "More" → "Settings" with ⚙️ icon
- `components/VoiceRecorder.tsx` — new voice recording component
- `components/PhotoCapture.tsx` — new photo capture component
- `app/parent/more/page.tsx` — renamed header, added Family Members menu item
- `app/parent/family/page.tsx` — new family members management page
- `app/parent/actions/page.tsx` — added memo UI to Quick Log modal
- `app/parent/page.tsx` — added memo UI to home page quick action sheet, memo indicators in activity feed
- `lib/i18n.ts` — added `nav.settings` key for en/zh

---

### Round 11 — Family Ownership, Join Flow & Daily Chart (Mar 2026)

---

#### FB-17 · Family Display Code & Identity  *(Completed)*

Each family gets a unique, human-readable 6-character code (e.g. `SMT-4K2`) generated at creation time. This code is:
- Displayed prominently in the Family Members page
- Copyable to clipboard
- Shown during setup after family creation
- Used by new users to request joining an existing family

**Data model changes:**
```
Family += { displayCode: string, ownerId: string }
```

---

#### FB-18 · Create vs Join Family Flow  *(Completed)*

After signup, users without a family see a choice screen:
1. **Create a new family** — name the family, become the owner/admin
2. **Join an existing family** — enter a family code to send a join request

Both paths require a profile setup step first (name, avatar, relationship role).

**Join flow:**
- User enters the family code → submits join request
- Family owner sees the request in the Family Members page
- Owner can approve (auto-creates member) or deny
- Join request is stored locally as `JoinRequest` entity

**Data model additions:**
```
JoinRequest { id, familyId, requesterName, requesterAvatar, requestedRole, birthday?, status, createdAt }
JoinRequestStatus = 'pending' | 'approved' | 'denied'
```

---

#### FB-19 · Family Ownership & Admin Controls  *(Completed)*

The first parent who creates the family is the **owner/admin**:
- Owner badge displayed on their member card
- Owner can: add/edit/remove members, change relationships, approve join requests, approve invites from non-owners
- Owner can transfer ownership to another non-kid family member via a two-step confirmation dialog
- Non-owners can create invite links, but they require owner approval before becoming active

**Invite approval flow:**
- Non-owner creates invite → status `pending_approval`
- Owner creates invite → auto-approved
- Owner sees pending invites in a separate section and can approve or delete

**Data model changes:**
```
FamilyMember += { isOwner?: boolean }
FamilyInvite += { status: 'pending_approval' | 'approved' | 'used', createdBy?: string }
InviteStatus = 'pending_approval' | 'approved' | 'used'
```

**Ownership transfer:**
- Owner selects a non-kid member → confirms twice → ownership moves
- Old owner loses admin badge, new owner gains it
- Family.ownerId updated atomically with member isOwner flags

---

#### FB-20 · Daily Points Chart  *(Completed)*

Bar chart on the parent home page showing last 7 days of star activity:
- **Green bars**: stars earned (brighter green for today)
- **Red bars**: stars deducted/redeemed (brighter red for today)
- Summary row: total earned, total deducted, net change
- Pure HTML/CSS implementation, no chart library
- Responsive, auto-scales to max value

**Component:** `DailyPointsChart.tsx`
**Location:** Parent home page, between kid cards and activity feed

---

#### Files Changed (Round 11)

- `types/index.ts` — added `displayCode`, `ownerId` to Family; `isOwner` to FamilyMember; `InviteStatus`, `JoinRequest`, `JoinRequestStatus` types; `joinRequests` to AppStore
- `lib/ids.ts` — added `generateFamilyCode()` for short readable codes
- `lib/store.ts` — added `joinRequests: []` to DEFAULT_STORE
- `context/FamilyContext.tsx` — updated `createFamily` with owner/code generation; added join request CRUD, invite approval, ownership transfer; new reducer cases
- `app/setup/page.tsx` — redesigned: choice screen (create/join), profile setup, join-by-code flow, family code display
- `app/parent/family/page.tsx` — added family code card, join request approval section, invite approval section, owner badge, transfer ownership, owner-only edit/remove guards
- `components/DailyPointsChart.tsx` — new 7-day bar chart component
- `app/parent/page.tsx` — added DailyPointsChart to home page
