# Guild Roster Page — Design Spec

**Date:** 2026-06-14
**Status:** Approved

---

## Overview

Add a Guild Roster page at `/roster` that displays all members of the guild, grouped by role (R5–R1) and sorted within each group by influence descending. A collapsible sidebar nav links the Leaderboard and Roster pages across the app.

---

## Routes & Navigation

### New route
- `/roster` — Guild Roster page

### Sidebar navigation
- Lives in `+layout.svelte` so it is present on both pages.
- **Wide viewport (≥ 640px):** sidebar is always visible on the left; main content sits to its right.
- **Narrow viewport (< 640px):** sidebar collapses to hidden; a `☰` toggle button appears top-left and opens the sidebar as an overlay on top of the content.
- Sidebar contains: site title ("Top Heroes Stats") and two nav links — **Leaderboard** (`/`) and **Guild Roster** (`/roster`). Active link is highlighted in gold.

---

## Data Layer

### New function: `getRosterMembers()` in `src/lib/pb.js`

Fetches all records from the `topHeroesGuildRoster` collection:

```js
fields: 'player_name,rank,level,castle_level,influence,main_queue_influence,main_queue_faction,last_online,updated'
sort: '-influence'
perPage: 500
```

Returns the raw items array. Also derives `lastUpdated` — the most recent `updated` value across all returned records — which is passed up to the page component.

### Faction colour mapping

Applied at render time (not stored):

| Faction | Background | Text | Border |
|---|---|---|---|
| Horde | `#3a1e1e` | `#ff8060` | `#6b3030` |
| League | `#1e3a5f` | `#60aaff` | `#2a5080` |
| Nature | `#1e2e1e` | `#60d060` | `#306030` |

---

## Roster Page (`src/routes/roster/+page.svelte`)

### Last updated indicator

Displayed at the top of the page, above the roster content:

> *Roster last updated: Jun 14, 2026 at 3:42 PM*

Derived from the most recent `updated` field across all records. Formatted in the user's local timezone using `toLocaleString()`.

### Role sections

Records are grouped by `rank` after fetching. Sections render in order R5 → R4 → R3 → R2 → R1. Empty role groups are omitted entirely.

#### R5 — Guild Master

One member only. Rendered as a single wide card (max-width 520px) with:
- Gold gradient background (`linear-gradient(135deg, #1f1a00, #1a1a1a)`)
- Gold border (`#5a4500`)
- Gold glow box-shadow
- Crown emoji (👑) with "R5" label on the left
- Large bold name in gold
- Level, castle level, faction badge, and `last_online` in a row below the name
- Influence (large, green) and MQ influence on the right

#### R4–R1

Each section has:
- A labeled divider: `R4 ————` (full-width rule, `#222`, label in small-caps grey)
- A responsive card grid below it: 3 columns ≥ 768px, 2 columns 480–767px, 1 column < 480px

Each card shows:
- Role label (small, grey, top-left)
- Member name (bold, white)
- 2×2 stat grid: Level, Castle, Influence (green), MQ Influence (green)
- Faction badge (colour-coded pill, bottom of card)
- Last online (small, grey, bottom of card — formatted as relative time e.g. "3 days ago")
- R4 cards get a subtle gold-tinted top border (`#c0a040`); R3–R1 have no coloured top border

### Loading & error states

Match the existing leaderboard pattern: centred "Loading…" text while fetching, centred red error message on failure, and the sections render once data arrives.

---

## Last Online Formatting

`last_online` is formatted as a human-readable relative string:
- < 1 hour ago → "X minutes ago"
- < 24 hours → "X hours ago"
- ≥ 1 day → "X days ago"

A small utility function `formatRelativeTime(dateStr)` is added to `src/lib/utils.js`.

---

## New & Modified Files

| File | Change |
|---|---|
| `src/routes/roster/+page.svelte` | New — roster page |
| `src/lib/components/RosterCard.svelte` | New — single member card (handles both R5 and standard variants via a prop) |
| `src/lib/pb.js` | Add `getRosterMembers()` |
| `src/lib/utils.js` | Add `formatRelativeTime(dateStr)` |
| `src/routes/+layout.svelte` | Add sidebar nav markup (also moves site title here from +page.svelte) |
| `src/routes/+page.svelte` | Remove `<h1>Top Heroes Stats</h1>` (moved to sidebar) |
| `src/app.css` | Add sidebar layout, overlay, and toggle button styles |

---

## Out of Scope

- Sorting or filtering within the roster page
- Search
- Click-through to individual member profiles
- Editing roster data
