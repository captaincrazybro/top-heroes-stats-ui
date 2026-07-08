# Other Players tab + guild filter — Design

## Background

The `topHeroesGuildRoster` PocketBase collection has a new `guild_tag` field on
each record. It can be `"HGS"`, empty/absent, or another guild's tag — it
tracks which guild a player (who has since left HGS, `joined=false`) is
currently in.

The existing "Past Members" tab shows all `joined=false` roster records with
no guild breakdown. We're renaming it to "Other Players" and adding a
dropdown to filter by `guild_tag`.

## Goals

- Rename "Past Members" → "Other Players" (nav label, page heading, and route
  path).
- Let the user filter the Other Players list by guild: "All", "None" (no
  guild_tag), or any specific guild tag found in the data.
- Surface each player's guild on their card so it's visible without opening
  the dropdown.

## Non-goals

- No changes to the main Guild Roster page's data or behavior.
- No backend/PocketBase schema changes — `guild_tag` already exists on the
  collection.
- No change to how "joined" status is determined; `joined=false` remains the
  query filter for this tab.

## Design

### Route & navigation

- `src/routes/past-members/` is renamed to `src/routes/other-players/`.
- `src/routes/+layout.svelte` sidebar link updates: `href="/other-players"`,
  label "Other Players" (icon 👤 unchanged).

### Data layer (`src/lib/pb.js`)

- `MEMBERS_FIELDS` (shared by `getRosterMembers` and the past-members query)
  gains `guild_tag`.
- `getPastMembers()` is renamed to `getOtherPlayers()`. Behavior is
  unchanged: filters `joined=false`, sorts `-influence`, `perPage=500`.
- `pb.test.js` references to `getPastMembers` are renamed to
  `getOtherPlayers`.

### Page (`src/routes/other-players/+page.svelte`)

- Renamed from the past-members page; imports `getOtherPlayers` instead of
  `getPastMembers`.
- After the fetch resolves, derive the set of distinct non-empty `guild_tag`
  values present in `members`, sorted alphabetically.
- Dropdown options, in order: `All`, `None`, then each distinct guild tag.
- `selectedGuild` state defaults to `'All'`.
- A `$derived` filters the fetched `members` array in-browser (no extra
  network round-trip):
  - `All` → all members
  - `None` → members where `guild_tag` is empty/missing
  - otherwise → members where `guild_tag` matches the selection
- The dropdown renders above the existing member-count line, using a simple
  `<label><select>` matching the app's existing dark-theme form styling
  (consistent with the `<select>` in `FilterBar.svelte`, defined locally in
  this page since it's specific to this tab).
- `RosterCard` is rendered with `showGuildTag={true}`.
- Empty-state message adjusts to reflect the active filter (e.g. "No other
  players found for this guild.") when a non-`All` filter yields zero
  results, vs. the existing "No past members found." message when there are
  no `joined=false` records at all.

### `RosterCard.svelte`

- New prop `showGuildTag = false`, defaulting off so the main Guild Roster
  page (`src/routes/+page.svelte`) is unaffected.
- When `true`, the standard card variant renders a small badge next to the
  player name showing `member.guild_tag || 'None'`.
- Badge styling: a smaller, muted/neutral pill (distinct from the gold
  `faction-badge` accent already used in the modal, to avoid implying rank
  or importance) — e.g. dark background, gray border/text, ~10px font.
- The `master` variant is not touched, since it's only used for the current
  R5 guild master on the main roster page and never rendered on the Other
  Players page.

## Testing

- Update `pb.test.js`'s `getPastMembers` describe block to `getOtherPlayers`
  (function name, mock expectations for the `fields` param including
  `guild_tag`).
- Manual check: load the Other Players page, confirm the dropdown lists
  `All`, `None`, and real guild tags from data, and that selecting each
  filters the visible cards correctly, including the `None` bucket for
  records with an empty `guild_tag`.
