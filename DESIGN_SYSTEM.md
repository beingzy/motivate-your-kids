# Design System Specification — Explorer Kids App

> This document is intended as instructions for a coding agent (e.g. Claude Code) to follow when building any screen in this app.

---

## 1. Color Palette

### Core Brand Colors

| Token                   | Hex       | Usage                                                                                                    |
| ----------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `--color-primary`       | `#E8612D` | Primary CTA buttons, active tab icons, star badges, the dominant brand accent. A warm, energetic orange. |
| `--color-primary-hover` | `#D4551F` | Hover/pressed state for primary buttons (darken ~8%)                                                     |
| `--color-primary-light` | `#FFF4EF` | Light tint background behind primary elements, chip backgrounds                                          |

### Semantic Colors

| Token                   | Hex       | Usage                                                     |
| ----------------------- | --------- | --------------------------------------------------------- |
| `--color-success`       | `#22C55E` | Completed badges, positive activity icons (green circles) |
| `--color-success-light` | `#DCFCE7` | Success badge background tint                             |
| `--color-warning`       | `#F59E0B` | Achievement badges, amber activity icons                  |
| `--color-warning-light` | `#FEF3C7` | Warning/achievement badge background tint                 |
| `--color-error`         | `#EF4444` | Error states (not shown, but derive from brand warmth)    |
| `--color-error-light`   | `#FEE2E2` | Error background tint                                     |

### Child Theme Colors (per-child accent)

Each child profile uses a distinct accent to differentiate progress bars, buttons, and highlights:

| Token                        | Hex       | Usage                                                 |
| ---------------------------- | --------- | ----------------------------------------------------- |
| `--color-child-coral`        | `#E84C5E` | Emma's theme — progress bars, CTA button, level badge |
| `--color-child-coral-light`  | `#FFF0F2` | Emma card background tint                             |
| `--color-child-indigo`       | `#5B6ABF` | Jake's theme — progress bars, CTA button, level badge |
| `--color-child-indigo-light` | `#EEEFFE` | Jake card background tint                             |

### Surfaces & Neutrals

| Token                               | Hex               | Usage                                                              |
| ----------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `--color-surface`                   | `#FFFFFF`         | Card backgrounds, modal background                                 |
| `--color-background`                | `#F8F5F2`         | Main page background — warm off-white with slight peach/blush tint |
| `--color-background-gradient-start` | `#F0E4F4`         | Top of page gradient (soft lavender-pink)                          |
| `--color-background-gradient-end`   | `#FDF1EC`         | Bottom of page gradient (warm peach-cream)                         |
| `--color-surface-muted`             | `#F5F5F5`         | Disabled card backgrounds, locked item backgrounds                 |
| `--color-overlay`                   | `rgba(0,0,0,0.3)` | Modal backdrop overlay                                             |

### Borders & Dividers

| Token             | Hex       | Usage                                              |
| ----------------- | --------- | -------------------------------------------------- |
| `--color-border`  | `#E5E7EB` | Subtle card borders (very light, nearly invisible) |
| `--color-divider` | `#F0F0F0` | Horizontal dividers between activity list items    |

### Category Tile Colors (Screen 3 — Award Stars)

Each category uses a distinct pastel background with a matching darker icon:

| Category  | Background               | Icon Color         |
| --------- | ------------------------ | ------------------ |
| Chores    | `#DBEAFE` (light blue)   | `#3B82F6` (blue)   |
| Academics | `#FDE9D0` (light peach)  | `#E8612D` (orange) |
| Behavior  | `#FEF9C3` (light yellow) | `#D4A017` (gold)   |
| Health    | `#FBCFE8` (light pink)   | `#EC4899` (pink)   |

### Text Colors

| Token                    | Hex       | Usage                                                             |
| ------------------------ | --------- | ----------------------------------------------------------------- |
| `--color-text-primary`   | `#1E293B` | Headings, names, primary content (near-black with blue undertone) |
| `--color-text-secondary` | `#64748B` | Subtitles, descriptions, timestamps, "Daily Goal" labels          |
| `--color-text-muted`     | `#94A3B8` | Disabled text, "Locked" label, placeholders                       |
| `--color-text-inverse`   | `#FFFFFF` | Text on primary-color buttons                                     |
| `--color-text-link`      | `#E8612D` | "See All" links, interactive text — uses primary orange           |
| `--color-text-overline`  | `#94A3B8` | All-caps overline text like "WELCOME BACK", "PICK A CATEGORY"     |

---

## 2. Typography

### Font Family

```css
--font-family: "Nunito", "Nunito Sans", system-ui, -apple-system, sans-serif;
```

The typeface is rounded and friendly — a humanist sans-serif with soft terminals. Nunito is the closest match. Every piece of text uses this single family.

### Type Scale

| Token                 | Size | Weight          | Usage                                                                       |
| --------------------- | ---- | --------------- | --------------------------------------------------------------------------- |
| `--text-heading-xl`   | 28px | 800 (ExtraBold) | Page titles: "Your Explorers", "Recent Activity"                            |
| `--text-heading-lg`   | 24px | 700 (Bold)      | Child name in profile card: "Emma", "Jake"                                  |
| `--text-heading-md`   | 20px | 700 (Bold)      | "Reward Shop", "Award Stars for Emma", product titles                       |
| `--text-heading-sm`   | 16px | 700 (Bold)      | Section labels, "CONFIRM" button text                                       |
| `--text-body`         | 15px | 600 (SemiBold)  | Button labels: "View Emma's Progress", "Get Now"                            |
| `--text-body-regular` | 14px | 400 (Regular)   | Descriptions, subtitles: "Softest friend ever!", "Age 5 · Reading Explorer" |
| `--text-caption`      | 12px | 600 (SemiBold)  | Badge text: "COMPLETED", "ACHIEVEMENT", "ACTIVE", "LEVEL 12"                |
| `--text-overline`     | 11px | 700 (Bold)      | All-caps labels: "WELCOME BACK", "PICK A CATEGORY" — letter-spacing: 1.5px  |
| `--text-small`        | 12px | 400 (Regular)   | Timestamps: "15 minutes ago", "1 hour ago"                                  |

### Line Height

```css
--leading-tight: 1.2; /* Headings */
--leading-normal: 1.5; /* Body text, descriptions */
--leading-relaxed: 1.6; /* Long-form text if needed */
```

### Key Typography Rules

- Headings use heavy weights (700–800) consistently. Never use light weights.
- All-caps text always has increased letter-spacing (~1.5px).
- Child subtitle text ("Age 5 · Reading Explorer") uses the child's accent color, not gray.
- Percentage labels on progress bars ("80%") are bold and use the child's accent color.
- Product descriptions use regular weight, secondary text color.

---

## 3. Spacing System

### Base Unit

```css
--space-unit: 4px;
```

All spacing derives from a 4px grid. Common increments used:

| Token         | Value | Usage                                                             |
| ------------- | ----- | ----------------------------------------------------------------- |
| `--space-xs`  | 4px   | Tight gaps: between icon and badge text                           |
| `--space-sm`  | 8px   | Inner gaps: between subtitle lines, chip padding vertical         |
| `--space-md`  | 12px  | Standard gap between related elements                             |
| `--space-lg`  | 16px  | Card inner padding, gap between cards                             |
| `--space-xl`  | 20px  | Horizontal page margin (left/right gutter)                        |
| `--space-2xl` | 24px  | Gap between major sections (e.g., "Your Explorers" to first card) |
| `--space-3xl` | 32px  | Top padding of page, bottom padding above nav                     |

### Page-Level Spacing

- **Horizontal page padding**: 20px left and right (consistent across all screens)
- **Top safe area + padding**: ~56px from top of viewport to first content
- **Section title to section content gap**: 16px
- **Between sibling cards**: 16px vertical gap
- **Bottom nav height**: 64px (content needs bottom padding of at least 80px)

### Card Internal Spacing

- **Card padding**: 16px on all sides
- **Avatar to text gap**: 12px
- **Progress bar to button gap**: 16px
- **Internal vertical gaps between child info lines**: 4px

---

## 4. Component Patterns

### 4.1 Profile Card (Home Screen)

```
┌──────────────────────────────────────────┐
│  ┌──────┐                     ┌────────┐ │
│  │avatar│  Name           │ LEVEL XX │ │
│  │ 56px │  subtitle (colored)  └────────┘ │
│  └──────┘                                │
│                                          │
│  Daily Goal: [description]        [XX%]  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  (progress)  │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │      View [Name]'s Progress          ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

- Background: `--color-surface` with very subtle colored tint (child's accent at ~3% opacity)
- Border-radius: 20px
- Shadow: `0 2px 12px rgba(0,0,0,0.06)`
- Avatar: 56px circle, 2px border in child's accent color
- Level badge: small rounded pill, child's accent color background, white text, positioned top-right relative to name
- Progress bar: 8px height, full border-radius, track is `#E5E7EB`, fill is child's accent color
- CTA button: full-width inside card, child's accent color background, white text, 48px height, 14px border-radius

### 4.2 Streak Banner

- Warm cream background (`#FFF8F0`) with subtle orange-tinted border (`rgba(232,97,45,0.15)`)
- Fire emoji prefix
- Text in `--color-primary` (orange), semi-bold
- Border-radius: 12px
- Padding: 12px 16px
- Sits between last card and CTA button inside the card area

### 4.3 Reward Shop Product Card (Screen 2)

```
┌──────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐│
│  │                              ⭐ 20   ││
│  │           [product image]            ││
│  │                                      ││
│  └──────────────────────────────────────┘│
│                                          │
│  Product Name                            │
│  Short description                       │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │             Get Now                  ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

- Card: white surface, 20px border-radius, subtle shadow
- Image area: light gray background (`#F8F8F8`), 16px border-radius, inset within card
- Star price badge: positioned top-right of image area, orange pill with white star icon + number
- "Get Now" button: `--color-primary` background, white text, full-width, 44px height, 12px border-radius
- Locked state: image desaturated (grayscale filter), centered lock icon overlay with `rgba(255,255,255,0.85)` circle behind it, button text changes to "More Stars Needed" with border-only style (no fill), muted text color

### 4.4 Category Tile (Screen 3)

- Size: roughly equal squares in a 2-column grid with 16px gap
- Background: pastel color specific to category (see Category Tile Colors above)
- Border-radius: 20px
- Content: centered large icon (40px) + label below
- Padding: 24px vertical, centered horizontally
- No border, no shadow — relies purely on pastel fill for definition
- Selectable: on selection, likely gets a 2-3px border in the category's darker icon color

### 4.5 Buttons

#### Primary Button (filled)

- Background: `--color-primary` (`#E8612D`)
- Text: white, 15px semi-bold, centered
- Height: 48px
- Border-radius: 14px
- Full-width within its container
- Shadow: `0 4px 12px rgba(232,97,45,0.25)`
- No border

#### Child-Themed Button (filled)

- Same structure as primary, but uses child's accent color
- Examples: "View Emma's Progress" (coral), "View Jake's Progress" (indigo)

#### Secondary Button (outline/ghost)

- Background: transparent or `#F5F5F5`
- Border: 1.5px solid `#D1D5DB`
- Text: `--color-text-secondary`
- Height: 44px
- Border-radius: 12px
- Used for: "More Stars Needed" (locked/disabled state)

#### Filter Chip

- Active: `--color-primary` background, white text, small icon prefix
- Inactive: white or `#F5F5F5` background, `--color-text-secondary` text, border `#E5E7EB`
- Height: 36px
- Border-radius: 18px (full pill)
- Padding: 8px 16px
- Icon + text layout, 6px gap between icon and label

### 4.6 Activity List Item

```
┌─────────────────────────────────────────────────────┐
│  ┌────┐   Emma finished "The       ┌───────────┐   │
│  │icon│   Blue Whale"               │ COMPLETED │   │
│  │32px│   15 minutes ago            └───────────┘   │
│  └────┘                                             │
├─────────────────────────────────────────────────────┤
│  (next item...)                                     │
```

- No card wrapping — these are plain rows within a containing card or surface
- Icon: 36px circle with colored background (green for completed, orange for achievement, indigo for active) + white icon inset
- Text: primary text for description, `--text-small` muted for timestamp
- Status badge: all-caps caption text, colored to match status, with a very light tinted pill background
- Divider: 1px `--color-divider` line between items, full-width with ~52px left indent (to align under text, not icon)

### 4.7 Navigation Bar (Bottom Tabs)

- Background: white with top border or subtle shadow (`0 -2px 10px rgba(0,0,0,0.05)`)
- Height: 64px + safe area inset
- 5 tab items evenly distributed
- Center tab: floating action button — 56px circle, `--color-primary` background, white "+" icon, raised `-16px` above the bar, shadow `0 4px 16px rgba(232,97,45,0.3)`
- Active tab: `--color-primary` tint on icon + label
- Inactive tab: `--color-text-muted`
- Icon size: 24px
- Label: 10px, 500 weight, 4px below icon

### 4.8 Header Pattern

- Left: optional avatar (32px circle) + greeting text or icon + page title
- Right: action icon (notification bell, star balance pill)
- Greeting text: overline "WELCOME BACK" in muted + name in heading-lg bold
- Top padding accounts for device safe area
- No visible background bar — the header sits on the page gradient

### 4.9 Modal / Bottom Sheet (Screen 3)

- Full-screen modal with light blue-gray overlay background (`#D6DDE4` at ~90% opacity)
- Content card: white, 24px border-radius on top corners, fills most of screen
- Internal padding: 24px
- Close button: top-right, 32px hit area, simple X icon, `--color-text-secondary`
- Page indicator dots at bottom: 8px circles, active = `--color-text-primary`, inactive = `--color-border`

### 4.10 Progress Bar

- Height: 8px
- Border-radius: 4px (full round)
- Track background: `#E5E7EB`
- Fill: child's accent color (or semantic color for other contexts)
- Percentage label sits to the right of the bar, aligned baseline, using child's accent color, bold

### 4.11 Avatar

- Small (header greeting): 40px circle
- Medium (child profile card): 56px circle
- Large (modal header): 48px circle
- Border: 2px solid, color matches context (child accent or `#E5E7EB` default)
- Always circular (border-radius: 50%)
- Object-fit: cover

### 4.12 Badge / Pill

- Level badge: 28px height, pill shape, background = accent color, text = white, 10px bold
- Star cost badge: 24px height, pill with icon, orange background, white text
- Status badge (COMPLETED, ACTIVE, etc.): transparent background with very light color wash, colored text, all-caps, 11px, 600 weight, 4px 10px padding, 8px border-radius

---

## 5. Layout Patterns

### Screen Layout

```
┌─ Safe Area Inset ──────────────────────┐
│                                        │
│  ┌─ Page Padding (20px each side) ──┐  │
│  │                                  │  │
│  │  [Header: greeting / page title] │  │
│  │                                  │  │
│  │  [Section Title]                 │  │
│  │  [Content — cards stack vertical]│  │
│  │  [Content — cards stack vertical]│  │
│  │                                  │  │
│  │  [Section Title]     [See All]   │  │
│  │  [List items]                    │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌─ Bottom Nav (sticky) ───────────┐   │
│  │  🏠  📊  [+]  📅  ⚙️           │   │
│  └─────────────────────────────────┘   │
└────────────────────────────────────────┘
```

### Grid Behavior

- **Single column layout** for all primary content — this is a mobile-first app
- Max-width: 428px (iPhone 14 Pro Max width — standard iOS large phone)
- No multi-column grids in main content, except:
  - Category tiles (Screen 3): 2-column grid, equal width, 16px gap
  - Filter chips: horizontal scrollable row

### Scroll Behavior

- Vertical scroll on main content area
- Bottom nav is fixed/sticky
- Header may scroll with content or be sticky (use sticky for consistency)

### Section Pattern

Every content section follows this structure:

1. **Section header row**: title (left-aligned, heading-xl) + optional "See All" link (right-aligned, primary color)
2. **24px gap** to content
3. **Content** (cards, lists, grids) with 16px gaps between items
4. **32px gap** to next section

### Responsive Breakpoints

Since this is primarily a mobile app:

| Breakpoint            | Behavior                                                            |
| --------------------- | ------------------------------------------------------------------- |
| < 375px (small phone) | Reduce page padding to 16px, category tiles stay 2-col              |
| 375–428px (standard)  | Default sizing as specified                                         |
| > 428px (tablet/web)  | Center content with max-width 428px, page background fills viewport |

---

## 6. Visual Treatment

### Border Radii

| Token           | Value  | Usage                                                       |
| --------------- | ------ | ----------------------------------------------------------- |
| `--radius-xs`   | 8px    | Status badges, small pills                                  |
| `--radius-sm`   | 12px   | Filter chips, small buttons, image containers               |
| `--radius-md`   | 16px   | Medium elements, product image area                         |
| `--radius-lg`   | 20px   | Cards, category tiles, modal content area                   |
| `--radius-xl`   | 24px   | Bottom sheet top corners                                    |
| `--radius-full` | 9999px | Avatars, floating action button, progress bars, pill badges |

### Shadows

| Token              | Value                             | Usage                                               |
| ------------------ | --------------------------------- | --------------------------------------------------- |
| `--shadow-sm`      | `0 1px 3px rgba(0,0,0,0.04)`      | Subtle lift on list items, filter chips             |
| `--shadow-md`      | `0 2px 12px rgba(0,0,0,0.06)`     | Cards — this is the primary card shadow             |
| `--shadow-lg`      | `0 4px 20px rgba(0,0,0,0.08)`     | Modal content area, elevated surfaces               |
| `--shadow-primary` | `0 4px 16px rgba(232,97,45,0.25)` | Primary CTA buttons, FAB — tinted with brand orange |
| `--shadow-nav`     | `0 -2px 10px rgba(0,0,0,0.05)`    | Bottom navigation bar (shadow on top edge)          |

### Background Layering

The page background is NOT flat white. It uses a subtle multi-stop gradient:

```css
body {
  background: linear-gradient(
    180deg,
    #f0e4f4 0%,
    /* Soft lavender at top */ #fdf1ec 30%,
    /* Warm peach */ #f8f5f2 60%,
    /* Neutral warm white */ #f8f5f2 100% /* Continues warm white */
  );
}
```

Cards sit on top as white surfaces with shadows, creating a layered depth effect.

### Borders

- Cards: generally NO visible border — rely on shadow + white surface on tinted background for definition
- Exception: streak banner uses a very subtle tinted border (`1px solid rgba(232,97,45,0.12)`)
- Inactive filter chips: `1px solid #E5E7EB`
- Dividers: `1px solid #F0F0F0` (very subtle)

### Iconography

- Style: filled/rounded icons, not outlined — matching the friendly, approachable tone
- Size: 24px for navigation, 20px for inline actions, 40px for category tile icons
- Color: matches context (primary for active, muted for inactive, white for on-color surfaces)
- Notification bell: outline style with no fill, 24px

---

## 7. Tone & Density

### Overall Feel

**Spacious, warm, playful, and parent-friendly.** This is an app designed for parents managing children's learning — it needs to feel encouraging, never overwhelming.

### Density

- **Spacious** — generous padding, large touch targets (48px min button height), ample whitespace between sections
- Information density is moderate: each card shows 4–5 data points (name, age/title, level, goal, progress) but spread across a comfortable layout
- No more than 2 child profile cards visible at once above the fold — emphasis on focus, not dashboard overload

### Emotional Qualities

- **Warm**: the peach/coral palette, rounded everything, soft shadows
- **Encouraging**: progress bars, streak celebrations, "Explorer" / "Master" titles
- **Trustworthy for parents**: clean layout, clear hierarchy, no visual clutter
- **Fun for kids** (reward shop): colorful product images, star currency, playful item names

### Motion Guidelines (Recommended)

- Card entry: fade in + slight upward translate (200ms, ease-out)
- Progress bar fill: animate from 0 to value on mount (600ms, ease-out)
- Button press: scale down to 0.97 (100ms) then release
- Page transitions: slide left/right (250ms, ease-in-out)
- Modal entry: slide up from bottom + backdrop fade in (300ms, ease-out)
- Streak banner: subtle pulse/glow on the fire emoji (infinite, slow)

### Accessibility Notes

- Maintain minimum 4.5:1 contrast ratio for text on surfaces
- Touch targets: minimum 44px (iOS guideline), this design uses 48px buttons
- Status badges use color + text (not color alone) — good
- Progress bars should include aria-valuenow, aria-valuemin, aria-valuemax

---

## 8. CSS Custom Properties Summary

```css
:root {
  /* Brand */
  --color-primary: #e8612d;
  --color-primary-hover: #d4551f;
  --color-primary-light: #fff4ef;

  /* Semantic */
  --color-success: #22c55e;
  --color-success-light: #dcfce7;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-error: #ef4444;
  --color-error-light: #fee2e2;

  /* Child themes */
  --color-child-coral: #e84c5e;
  --color-child-coral-light: #fff0f2;
  --color-child-indigo: #5b6abf;
  --color-child-indigo-light: #eeeffe;

  /* Surfaces */
  --color-surface: #ffffff;
  --color-background: #f8f5f2;
  --color-surface-muted: #f5f5f5;

  /* Text */
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  /* Border */
  --color-border: #e5e7eb;
  --color-divider: #f0f0f0;

  /* Category pastels */
  --color-cat-chores: #dbeafe;
  --color-cat-academics: #fde9d0;
  --color-cat-behavior: #fef9c3;
  --color-cat-health: #fbcfe8;

  /* Typography */
  --font-family: "Nunito", system-ui, -apple-system, sans-serif;
  --text-heading-xl: 28px;
  --text-heading-lg: 24px;
  --text-heading-md: 20px;
  --text-heading-sm: 16px;
  --text-body: 15px;
  --text-body-regular: 14px;
  --text-caption: 12px;
  --text-overline: 11px;
  --text-small: 12px;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;

  /* Radii */
  --radius-xs: 8px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-primary: 0 4px 16px rgba(232, 97, 45, 0.25);
  --shadow-nav: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
```

---

## 9. Rules for Building Un-Designed Screens

When creating a screen that has no Figma mockup, follow these rules:

1. **Always use the warm gradient background** — never flat white for a full page.
2. **Every content group lives in a white card** with `--radius-lg` and `--shadow-md`.
3. **Section headers are heading-xl weight-800** left-aligned, with optional "See All" in `--color-primary` right-aligned.
4. **Primary actions use the full-width orange button** inside cards — never floating or inline.
5. **Maintain 20px horizontal page padding** on every screen.
6. **Use 16px gap between sibling cards**, 24–32px between major sections.
7. **Icons are always filled/rounded** style, never outlined or sharp.
8. **New screens should feel like they belong** with the same warmth, roundness, and spaciousness — when in doubt, add more padding rather than less.
9. **Avoid hard lines and sharp corners** — minimum border-radius for any interactive element is 8px.
10. **Progress and stats always use child's accent color** — never generic gray or primary orange.
11. **Empty states**: center a friendly illustration (64px) + heading-md title + body-regular description + primary button.
12. **Loading states**: use skeleton screens with `--color-surface-muted` pulsing shapes matching the layout, not spinners.
