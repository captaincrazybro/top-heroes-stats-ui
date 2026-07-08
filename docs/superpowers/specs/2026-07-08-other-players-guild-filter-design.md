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
- Let the user switch the Other Players list between the existing card-grid
  view and a sortable table view (like Guild Rankings), scoped to the
  currently guild-filtered set of players.

## Non-goals

- No changes to the main Guild Roster page's data or behavior.
- No backend/PocketBase schema changes — `guild_tag` already exists on the
  collection.
- No change to how "joined" status is determined; `joined=false` remains the
  query filter for this tab.
- No table-view sort/column changes to the existing Guild Rankings page
  beyond the internal refactor described below (its rendered output is
  unchanged).

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

### Table view (shared `RankingsTable.svelte`)

The Guild Rankings table (currently markup, sort state, and helpers baked
directly into `src/routes/guild-rankings/+page.svelte`) is extracted into a
new reusable component, `src/lib/components/RankingsTable.svelte`, so Other
Players can reuse it instead of duplicating ~40 lines of table/sort logic.

- **Props:** `members` (unsorted array), `showGuildColumn = false`.
- **Internal state:** `sortCol`/`sortDir` (default `influence`/`desc`, same
  as today), computed `sorted` via `sortRecords` from `utils.js`. Sort state
  lives inside the component — callers just pass raw `members`.
- **Columns:** Rank, Name, Influence, Castle, MQ. Influence, Faction,
  Activity — unchanged from today. When `showGuildColumn` is `true`, an
  additional sortable **Guild** column is appended, rendering
  `member.guild_tag || 'None'`, sorted via the same `sortRecords` (string
  compare on `guild_tag`).
- `guild-rankings/+page.svelte` keeps its own data fetching
  (`getRosterMembers`) but replaces its inline table markup with
  `<RankingsTable {members} />` (no guild column) — rendered output is
  unchanged.
- `other-players/+page.svelte` renders
  `<RankingsTable members={filteredMembers} showGuildColumn={true} />` when
  table view is active, where `filteredMembers` is the same guild-filtered
  array used for the card grid.

### Other Players view toggle

- A "Table View" checkbox is added next to the guild dropdown, using the
  same toggle styling already established in `FilterBar.svelte`
  (`.toggle-group`/`.toggle-track`), for visual consistency with the rest of
  the app.
- `tableView` state defaults to `false` (card grid, today's behavior).
- When `tableView` is `true`, the page renders `RankingsTable` instead of
  the `RosterCard` grid, passing the same `filteredMembers` (guild dropdown
  selection applies to both views).
- The member-count line and empty-state messaging stay above/apply to
  whichever view is active.

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
