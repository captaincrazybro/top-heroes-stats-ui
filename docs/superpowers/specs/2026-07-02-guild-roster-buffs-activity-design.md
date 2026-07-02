# Guild Roster — Buffs & Activity Visualization Design

## Overview

Add visual indicators for two new fields on the `topHeroesGuildRoster` collection to the Guild Roster home page member cards:

- `guild_member_buffs` — multi-select field with values `wings`, `aura`, `chess`
- `has_aoe_buffs` — boolean field
- `chat_activity` — string enum: `hyperactive`, `active`, `daily`, `weekly`, `none`

## Chosen Approach: Status Strip (Option C)

A dedicated footer band appended below the card body on both the standard roster card and the Guild Master card. The strip is divided into two equal-width columns:

### Left column — Buffs

- Label: "BUFFS" (small, dimmed, uppercase)
- Content: emoji icons for each active buff, displayed side by side
  - 🪽 — shown when `guild_member_buffs` includes `wings` — tooltip: "Castle Wings"
  - ✨ — shown when `guild_member_buffs` includes `aura` — tooltip: "Castle Aura"
  - ♟ — shown when `guild_member_buffs` includes `chess` — tooltip: "Chess Set Buffs"
  - 🌀 — shown when `has_aoe_buffs` is `true` — tooltip: "Area of Effect Buffs"
  - If no buffs are active: display `—`
- Emojis use native `title` attributes for tooltips; `cursor: help` on hover

### Right column — Activity

- Label: "ACTIVITY" (small, dimmed, uppercase)
- Content: 5-bar signal-strength visualization (no text label), colored by level:

| Value        | Filled bars | Color    |
|--------------|-------------|----------|
| hyperactive  | 5           | #4af87a  |
| active       | 4           | #4af8c0  |
| daily        | 3           | #f8c34a  |
| weekly       | 2           | #f87a4a  |
| none         | 0           | dim only |

- Bars grow in height left-to-right (3px → 6px → 9px → 12px → 14px), rounded top corners
- Unfilled bars render in dim background color (#252525)

### Strip styling

- Background slightly darker than card body (`#141414`)
- Top border separator (`1px solid #1f1f1f`)
- Padding: `7px 13px`
- Both columns `flex: 1` so they share width equally, both left-aligned
- Applied to both the standard roster card and the Guild Master (R5) card

## Data Changes

`pb.js` — `MEMBERS_FIELDS` constant currently enumerates specific fields. Add the three new fields:

```js
const MEMBERS_FIELDS = 'id,player_name,rank,level,castle_level,influence,main_queue_influence,main_queue_faction,last_online,updated,recent_ranked_match_ranking,timezone,language,guild_member_buffs,has_aoe_buffs,chat_activity';
```

`getPastMembers()` uses the same `MEMBERS_FIELDS` constant, so it gets the new fields automatically.

## Component Changes

`RosterCard.svelte` — add the status strip to both card variants.

The strip is self-contained markup added after the existing card content. Define a `BUFFS` lookup and a `SIGNAL` helper inside `<script>`:

```js
const BUFFS = [
  { key: 'wings', emoji: '🪽', label: 'Castle Wings' },
  { key: 'aura',  emoji: '✨', label: 'Castle Aura' },
  { key: 'chess', emoji: '♟', label: 'Chess Set Buffs' },
];

const ACTIVITY_LEVELS = { hyperactive: 5, active: 4, daily: 3, weekly: 2, none: 0 };
const ACTIVITY_COLORS = {
  hyperactive: '#4af87a',
  active:      '#4af8c0',
  daily:       '#f8c34a',
  weekly:      '#f87a4a',
  none:        '#252525',
};
```

Active buffs are derived:
```js
const activeBuffs = $derived([
  ...BUFFS.filter(b => member.guild_member_buffs?.includes(b.key)),
  ...(member.has_aoe_buffs ? [{ key: 'aoe', emoji: '🌀', label: 'Area of Effect Buffs' }] : []),
]);

const activityLevel = $derived(ACTIVITY_LEVELS[member.chat_activity] ?? 0);
const activityColor = $derived(ACTIVITY_COLORS[member.chat_activity] ?? '#252525');
```

The strip renders identically in both card variants (standard and master). Extract it as a snippet or inline it in both branches — inlining is acceptable given its small size.

## Non-goals

- No changes to the modal detail view
- No changes to the Event Results page or any other page
- No new routes or PocketBase collections
