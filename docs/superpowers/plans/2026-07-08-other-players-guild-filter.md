# Other Players Tab + Guild Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the "Past Members" tab to "Other Players", add a guild-tag filter dropdown, and add a "Table View" checkbox that switches the list to a sortable table (reusing the Guild Rankings table logic) scoped to the filtered players.

**Architecture:** SvelteKit app backed by PocketBase. Data access lives in `src/lib/pb.js` (thin fetch wrappers); pages in `src/routes/*` own their own state and fetch on mount; shared presentational pieces live in `src/lib/components/`. This plan renames one data function, extends one shared field list, adds a prop to an existing card component, extracts a reusable table component out of an existing page, and rewires the renamed page to use all of the above.

**Tech Stack:** Svelte 5 (runes: `$state`, `$derived`, `$props`), SvelteKit, Vitest for unit tests, PocketBase REST API via `fetch`.

## Global Constraints

- Route renamed: `/past-members` → `/other-players`. Data function renamed: `getPastMembers` → `getOtherPlayers`.
- Guild dropdown options, in order: `All`, `None`, then distinct `guild_tag` values found in the fetched data, sorted alphabetically (`Array.prototype.sort()` default string sort).
- Guild filtering is client-side over the already-fetched `joined=false` members — no extra network requests when the dropdown changes.
- Anywhere a guild tag is displayed (card badge, table column), render `member.guild_tag || 'None'`.
- `RankingsTable.svelte` is a new shared component. Guild Rankings page must render pixel-identical output to before this change (it passes no `showGuildColumn`, defaulting to `false`).
- `abbrev(n)` moves from a local function in `RosterCard.svelte` into `src/lib/utils.js` (it was verbatim-duplicated in the old `guild-rankings` page, which `RankingsTable.svelte` replaces) — both `RosterCard.svelte` and `RankingsTable.svelte` import it from there. `RosterCard.svelte`'s `FACTION` object (bg/color/border/icon for the badge chip) and the table's `FACTION_COLOR` (a single color string) are not duplicates of each other — different shapes for different rendering needs — and stay separate.
- The "Table View" checkbox reuses the exact toggle-switch visual pattern already defined in `src/lib/components/FilterBar.svelte` (`.toggle-group` / `.toggle-input` / `.toggle-track`).

---

### Task 1: Rename `getPastMembers` → `getOtherPlayers`, add `guild_tag` field

**Files:**
- Modify: `src/lib/pb.js:57-58,91-100`
- Modify: `src/lib/pb.test.js:6,146-176`

**Interfaces:**
- Produces: `getOtherPlayers(): Promise<{ members: Array<{ id, player_name, rank, level, castle_level, influence, main_queue_influence, main_queue_faction, last_online, updated, recent_ranked_match_ranking, timezone, language, guild_member_buffs, has_aoe_buffs, chat_activity, guild_tag }> }>` — same shape as the old `getPastMembers`, plus `guild_tag` on each member.

- [ ] **Step 1: Update the test file to expect `getOtherPlayers` and a `guild_tag` field request**

Edit `src/lib/pb.test.js` line 6:

```js
const { getEventOptions, getRecords, getRosterMembers, getOtherPlayers } = await import('./pb.js');
```

Replace the `describe('getPastMembers', ...)` block (lines 146-176) with:

```js
describe('getOtherPlayers', () => {
  const PAST_ITEM = {
    id: 'past1',
    player_name: 'Charlie', rank: 'R3', level: 70, castle_level: 18,
    influence: 2500000, main_queue_influence: 600000,
    main_queue_faction: 'Nature',
    last_online: '2026-06-10 08:00:00.000Z',
    updated: '2026-06-10 08:00:00.000Z',
    guild_tag: 'RVL',
  };

  test('returns members array from PocketBase response', async () => {
    vi.stubGlobal('fetch', mockFetch({ items: [PAST_ITEM] }));
    const { members } = await getOtherPlayers();
    expect(members).toEqual([PAST_ITEM]);
  });

  test('requests joined=false filter', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getOtherPlayers();
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('joined=false');
    expect(url).toContain('sort=-influence');
    expect(url).toContain('perPage=500');
  });

  test('requests guild_tag field', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getOtherPlayers();
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('guild_tag');
  });

  test('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Forbidden' }, 403));
    await expect(getOtherPlayers()).rejects.toThrow('403');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm run test`
Expected: FAIL — `pb.test.js` fails to resolve, e.g. `SyntaxError: The requested module './pb.js' does not provide an export named 'getOtherPlayers'` (since `pb.js` still only exports `getPastMembers`).

- [ ] **Step 3: Rename the function and add the field in `pb.js`**

Edit `src/lib/pb.js` line 58:

```js
const MEMBERS_FIELDS = 'id,player_name,rank,level,castle_level,influence,main_queue_influence,main_queue_faction,last_online,updated,recent_ranked_match_ranking,timezone,language,guild_member_buffs,has_aoe_buffs,chat_activity,guild_tag';
```

Edit `src/lib/pb.js` lines 91-100 — rename the function:

```js
export async function getOtherPlayers() {
  const params = new URLSearchParams({
    fields: MEMBERS_FIELDS,
    filter: 'joined=false',
    sort: '-influence',
    perPage: '500',
  });
  const data = await pbFetch(`/collections/${MEMBERS_COLLECTION}/records?${params}`);
  return { members: data.items };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm run test`
Expected: PASS — all suites green, including the three `getOtherPlayers` tests and the unchanged `getRosterMembers` tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pb.js src/lib/pb.test.js
git commit -m "refactor: rename getPastMembers to getOtherPlayers, add guild_tag field"
```

---

### Task 2: Rename the route from `/past-members` to `/other-players`

**Files:**
- Rename (via `git mv`): `src/routes/past-members/+page.svelte` → `src/routes/other-players/+page.svelte`
- Modify: `src/routes/other-players/+page.svelte` (the just-moved file)
- Modify: `src/routes/+layout.svelte:35-37`

**Interfaces:**
- Consumes: `getOtherPlayers()` from Task 1.
- Produces: page reachable at `/other-players`, sidebar link labeled "Other Players".

- [ ] **Step 1: Move the route folder**

```bash
git mv src/routes/past-members src/routes/other-players
```

- [ ] **Step 2: Update the moved page to use `getOtherPlayers` and "Other Players" wording**

Replace the full contents of `src/routes/other-players/+page.svelte` with:

```svelte
<script>
  import { onMount } from 'svelte';
  import { getOtherPlayers } from '$lib/pb.js';
  import RosterCard from '$lib/components/RosterCard.svelte';

  let members = $state([]);
  let loading = $state(false);
  let error = $state(null);

  onMount(async () => {
    loading = true;
    error = null;
    try {
      const result = await getOtherPlayers();
      members = result.members;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p class="status">Loading…</p>
{:else if error}
  <p class="status error">{error}</p>
{:else if members.length === 0}
  <p class="status">No other players found.</p>
{:else}
  <p class="member-count">{members.length} other {members.length === 1 ? 'player' : 'players'}</p>
  <div class="roster-grid">
    {#each members as member (member.id)}
      <RosterCard {member} />
    {/each}
  </div>
{/if}

<style>
  .member-count {
    font-size: 12px;
    color: #555;
    margin-bottom: 24px;
  }

  .roster-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  @media (max-width: 767px) {
    .roster-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 479px) {
    .roster-grid { grid-template-columns: 1fr; }
  }

  .status {
    padding: 2rem;
    color: #666;
    text-align: center;
  }

  .status.error { color: #f87a4a; }
</style>
```

- [ ] **Step 3: Update the sidebar link**

Edit `src/routes/+layout.svelte` lines 35-37:

```svelte
    <a href="/other-players" class="sidebar-link" class:active={$page.url.pathname === '/other-players'} onclick={close}>
      👤 Other Players
    </a>
```

- [ ] **Step 4: Verify no stale references remain**

Run: `grep -rn "past-members\|getPastMembers" src`
Expected: no output (empty) — confirms no leftover references to the old route or function name in application code.

- [ ] **Step 5: Build to confirm no compile errors**

Run: `npm run build`
Expected: build completes successfully with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: rename Past Members tab to Other Players"
```

---

### Task 3: Add a guild-tag badge to `RosterCard`

**Files:**
- Modify: `src/lib/components/RosterCard.svelte:2,93-106`

**Interfaces:**
- Consumes: `member.guild_tag` (string or empty/undefined) from the roster record shape produced by Task 1.
- Produces: new optional prop `showGuildTag = false` on `RosterCard`. When `true`, the standard (non-master) card renders a small badge showing `member.guild_tag || 'None'` next to the player name. Existing callers (`src/routes/+page.svelte`, `src/routes/other-players/+page.svelte`) are unaffected since the prop defaults to `false`.

- [ ] **Step 1: Add the `showGuildTag` prop**

Edit `src/lib/components/RosterCard.svelte` line 2:

```js
  let { member, variant = 'standard', showGuildTag = false } = $props();
```

- [ ] **Step 2: Render the badge in the standard card variant**

Edit `src/lib/components/RosterCard.svelte` lines 93-97 (the opening of the standard-variant card, currently):

```svelte
  <div class="roster-card" style="border-top-color:{topBorder};overflow:hidden;" role="button" tabindex="0" onclick={() => showModal = true} onkeydown={onKeydown}>
    <div class="card-content">
      <div class="card-name">{member.player_name}</div>
```

Replace with:

```svelte
  <div class="roster-card" style="border-top-color:{topBorder};overflow:hidden;" role="button" tabindex="0" onclick={() => showModal = true} onkeydown={onKeydown}>
    <div class="card-content">
      <div class="card-name-row">
        <div class="card-name">{member.player_name}</div>
        {#if showGuildTag}
          <span class="guild-tag-badge">{member.guild_tag || 'None'}</span>
        {/if}
      </div>
```

- [ ] **Step 3: Add styles for the badge**

Add to the `<style>` block in `src/lib/components/RosterCard.svelte`, right after the existing `.card-name { ... }` rule:

```css
  .card-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .guild-tag-badge {
    display: inline-block;
    font-size: 9px;
    padding: 1px 6px;
    border-radius: 8px;
    border: 1px solid #444;
    background: #222;
    color: #999;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .03em;
  }
```

- [ ] **Step 4: Build to confirm no compile errors**

Run: `npm run build`
Expected: build completes successfully with no errors.

- [ ] **Step 5: Manually verify the main roster page is unaffected**

Run: `npm run dev`, open `/` in a browser. Confirm no badge appears next to any player name (since `showGuildTag` defaults to `false` there) and the page looks exactly as before.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/RosterCard.svelte
git commit -m "feat: add optional guild tag badge to RosterCard"
```

---

### Task 4: Add the guild filter dropdown to the Other Players page

**Files:**
- Modify: `src/routes/other-players/+page.svelte` (rewritten in Task 2)

**Interfaces:**
- Consumes: `showGuildTag` prop on `RosterCard` from Task 3; `member.guild_tag` from Task 1.
- Produces: page-local reactive state `selectedGuild` (default `'All'`) and `filteredMembers` (derived), used unchanged by Task 6.

- [ ] **Step 1: Add guild option derivation, filter state, and filtered list**

Edit `src/routes/other-players/+page.svelte` — replace the script block with:

```svelte
<script>
  import { onMount } from 'svelte';
  import { getOtherPlayers } from '$lib/pb.js';
  import RosterCard from '$lib/components/RosterCard.svelte';

  let members = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let selectedGuild = $state('All');

  const guildOptions = $derived.by(() => {
    const tags = new Set();
    for (const m of members) {
      if (m.guild_tag) tags.add(m.guild_tag);
    }
    return ['All', 'None', ...[...tags].sort()];
  });

  const filteredMembers = $derived.by(() => {
    if (selectedGuild === 'All') return members;
    if (selectedGuild === 'None') return members.filter(m => !m.guild_tag);
    return members.filter(m => m.guild_tag === selectedGuild);
  });

  onMount(async () => {
    loading = true;
    error = null;
    try {
      const result = await getOtherPlayers();
      members = result.members;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>
```

- [ ] **Step 2: Render the dropdown and filter-aware list/empty-state**

Replace the markup block (everything between the closing `</script>` and the `<style>` tag) with:

```svelte
{#if loading}
  <p class="status">Loading…</p>
{:else if error}
  <p class="status error">{error}</p>
{:else}
  <div class="filter-row">
    <label class="guild-select">
      Guild
      <select bind:value={selectedGuild}>
        {#each guildOptions as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </label>
  </div>

  {#if filteredMembers.length === 0}
    <p class="status">
      {members.length === 0 ? 'No other players found.' : 'No other players found for this guild.'}
    </p>
  {:else}
    <p class="member-count">{filteredMembers.length} other {filteredMembers.length === 1 ? 'player' : 'players'}</p>
    <div class="roster-grid">
      {#each filteredMembers as member (member.id)}
        <RosterCard {member} showGuildTag={true} />
      {/each}
    </div>
  {/if}
{/if}
```

- [ ] **Step 3: Add styles for the filter row**

Add to the `<style>` block, before `.member-count`:

```css
  .filter-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .guild-select {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .guild-select select {
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
  }
```

- [ ] **Step 4: Build to confirm no compile errors**

Run: `npm run build`
Expected: build completes successfully with no errors.

- [ ] **Step 5: Manually verify filtering behavior**

Run: `npm run dev`, open `/other-players` in a browser. Confirm:
- The dropdown lists `All`, `None`, and every distinct `guild_tag` present in the data.
- Selecting a specific guild shows only matching cards (each showing that guild's badge); selecting `None` shows only cards with no badge value (rendered "None"); selecting `All` restores the full list.
- If a selection yields zero cards, the message reads "No other players found for this guild."

- [ ] **Step 6: Commit**

```bash
git add src/routes/other-players/+page.svelte
git commit -m "feat: add guild filter dropdown to Other Players page"
```

---

### Task 5: Extract the Guild Rankings table into a shared `RankingsTable` component

**Files:**
- Modify: `src/lib/utils.js`
- Modify: `src/lib/components/RosterCard.svelte`
- Create: `src/lib/components/RankingsTable.svelte`
- Modify: `src/routes/guild-rankings/+page.svelte`

**Interfaces:**
- Consumes: `sortRecords` from `src/lib/utils.js` (existing, unchanged).
- Produces: `abbrev(n)` exported from `src/lib/utils.js` (moved out of `RosterCard.svelte`, where it was verbatim-duplicated with the old `guild-rankings` page). `RankingsTable` component with props `members` (array, required) and `showGuildColumn = false` (boolean). Renders its own sort state and its own "No members found." empty state. Used by Task 6 with `showGuildColumn={true}`.

- [ ] **Step 1: Move `abbrev` into `utils.js`**

Add to `src/lib/utils.js` (anywhere at module scope, e.g. near the top):

```js
export function abbrev(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + ' k';
  return String(n);
}
```

- [ ] **Step 2: Update `RosterCard.svelte` to import it instead of defining it locally**

Edit `src/lib/components/RosterCard.svelte` — remove the local `function abbrev(n) { ... }` declaration (added in Task 3's surrounding code, originally lines 6-10), and add an import at the top of the `<script>` block:

```js
  import { abbrev } from '$lib/utils.js';
```

The rest of `RosterCard.svelte` (including the `showGuildTag` prop and badge from Task 3) is unchanged — only the `abbrev` definition moves out, its call sites stay the same.

- [ ] **Step 3: Create `RankingsTable.svelte`**

Create `src/lib/components/RankingsTable.svelte`:

```svelte
<script>
  import { sortRecords, abbrev } from '$lib/utils.js';

  let { members, showGuildColumn = false } = $props();

  const FACTION_COLOR = {
    Horde:  '#ff8060',
    League: '#60aaff',
    Nature: '#60d060',
  };

  let sortCol = $state('influence');
  let sortDir = $state('desc');

  const sorted = $derived(sortRecords(members, sortCol, sortDir));

  function toggleSort(col) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'player_name' || col === 'main_queue_faction' || col === 'guild_tag' ? 'asc' : 'desc';
    }
  }

  function indicator(col) {
    if (sortCol !== col) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }
</script>

{#if sorted.length === 0}
  <p class="status">No members found.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th class="rank-col">Rank</th>
        <th onclick={() => toggleSort('player_name')}>Name{indicator('player_name')}</th>
        <th onclick={() => toggleSort('influence')}>Influence{indicator('influence')}</th>
        <th onclick={() => toggleSort('castle_level')}>Castle{indicator('castle_level')}</th>
        <th onclick={() => toggleSort('main_queue_influence')}>MQ. Influence{indicator('main_queue_influence')}</th>
        <th onclick={() => toggleSort('main_queue_faction')}>Faction{indicator('main_queue_faction')}</th>
        <th class="activity-col" onclick={() => toggleSort('chat_activity')}>Activity{indicator('chat_activity')}</th>
        {#if showGuildColumn}
          <th class="guild-col" onclick={() => toggleSort('guild_tag')}>Guild{indicator('guild_tag')}</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each sorted as member, i (member.id)}
        <tr>
          <td>{i + 1}</td>
          <td>{member.player_name}</td>
          <td>{abbrev(member.influence)}</td>
          <td>{member.castle_level}</td>
          <td>{abbrev(member.main_queue_influence)}</td>
          <td style="color:{FACTION_COLOR[member.main_queue_faction] ?? '#888'};">{member.main_queue_faction}</td>
          <td class="activity-cell">{member.chat_activity ?? '—'}</td>
          {#if showGuildColumn}
            <td class="guild-cell">{member.guild_tag || 'None'}</td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .rank-col { cursor: default; }

  /* app.css styles the last column via :last-child; Guild is conditionally
     appended after Activity, so both columns get explicit styling instead
     of relying on table position. */
  .activity-col { text-align: right; }
  .activity-cell {
    text-transform: capitalize;
    text-align: right;
    color: #4af87a;
  }

  .guild-col { text-align: left; }
  .guild-cell { text-align: left; color: #e0e0e0; }

  .status {
    padding: 2rem;
    color: #666;
    text-align: center;
  }
</style>
```

- [ ] **Step 4: Rewrite the Guild Rankings page to use it**

Replace the full contents of `src/routes/guild-rankings/+page.svelte` with:

```svelte
<script>
  import { onMount } from 'svelte';
  import { getRosterMembers } from '$lib/pb.js';
  import RankingsTable from '$lib/components/RankingsTable.svelte';

  let members = $state([]);
  let loading = $state(false);
  let error = $state(null);

  onMount(async () => {
    loading = true;
    error = null;
    try {
      const result = await getRosterMembers();
      members = result.members;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p class="status">Loading…</p>
{:else if error}
  <p class="status error">{error}</p>
{:else}
  <RankingsTable {members} />
{/if}

<style>
  .status {
    padding: 2rem;
    color: #666;
    text-align: center;
  }

  .status.error { color: #f87a4a; }
</style>
```

- [ ] **Step 5: Build to confirm no compile errors**

Run: `npm run build`
Expected: build completes successfully with no errors.

- [ ] **Step 6: Manually verify Guild Rankings is unchanged, and the main roster page still shows correct numbers**

Run: `npm run dev`.
- Open `/guild-rankings`. Confirm the table looks and behaves exactly as before: same columns, Activity is still the last column and still renders green/right-aligned, clicking column headers still sorts (toggling direction on repeat clicks), and no "Guild" column appears.
- Open `/` (main roster). Confirm Influence and MQ Influence numbers on each card still render abbreviated (e.g. "4.2 M") exactly as before — this exercises the relocated `abbrev` import in `RosterCard.svelte`.

- [ ] **Step 7: Run the unit tests**

Run: `npm run test`
Expected: PASS — `utils.js`'s existing tests are unaffected; `abbrev` has no dedicated test suite today (none existed before this move either) so no new failures are expected.

- [ ] **Step 8: Commit**

```bash
git add src/lib/utils.js src/lib/components/RosterCard.svelte src/lib/components/RankingsTable.svelte src/routes/guild-rankings/+page.svelte
git commit -m "refactor: extract RankingsTable component and shared abbrev() out of Guild Rankings page"
```

---

### Task 6: Add the "Table View" checkbox to the Other Players page

**Files:**
- Modify: `src/routes/other-players/+page.svelte` (built up in Tasks 2 and 4)

**Interfaces:**
- Consumes: `RankingsTable` (props `members`, `showGuildColumn`) from Task 5; `filteredMembers`/`selectedGuild` from Task 4.
- Produces: page-local state `tableView` (default `false`); when `true`, renders `RankingsTable` instead of the `RosterCard` grid, using the same `filteredMembers`.

- [ ] **Step 1: Import `RankingsTable` and add `tableView` state**

Edit `src/routes/other-players/+page.svelte` script block — add the import and state declaration:

```js
  import RankingsTable from '$lib/components/RankingsTable.svelte';
```

```js
  let tableView = $state(false);
```

(Add the import next to the existing `RosterCard` import, and the state declaration next to `selectedGuild`.)

- [ ] **Step 2: Add the checkbox next to the guild dropdown**

Edit the `.filter-row` block to add the toggle after the `guild-select` label:

```svelte
  <div class="filter-row">
    <label class="guild-select">
      Guild
      <select bind:value={selectedGuild}>
        {#each guildOptions as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </label>

    <label class="toggle-group">
      Table View
      <input type="checkbox" class="toggle-input" checked={tableView} onchange={e => tableView = e.target.checked} />
      <span class="toggle-track"></span>
    </label>
  </div>
```

- [ ] **Step 3: Render the table view when active**

Edit the results block so it switches between the grid and the table:

```svelte
  {#if filteredMembers.length === 0}
    <p class="status">
      {members.length === 0 ? 'No other players found.' : 'No other players found for this guild.'}
    </p>
  {:else}
    <p class="member-count">{filteredMembers.length} other {filteredMembers.length === 1 ? 'player' : 'players'}</p>
    {#if tableView}
      <RankingsTable members={filteredMembers} showGuildColumn={true} />
    {:else}
      <div class="roster-grid">
        {#each filteredMembers as member (member.id)}
          <RosterCard {member} showGuildTag={true} />
        {/each}
      </div>
    {/if}
  {/if}
```

- [ ] **Step 4: Add the toggle-switch styles**

Add to the `<style>` block (copied from `src/lib/components/FilterBar.svelte`'s existing `.toggle-group` pattern for visual consistency):

```css
  .toggle-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    user-select: none;
  }

  .toggle-input { display: none; }

  .toggle-track {
    width: 32px;
    height: 18px;
    background: #333;
    border: 1px solid #555;
    border-radius: 9px;
    position: relative;
    margin-top: 6px;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;
  }

  .toggle-track::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background: #666;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.15s, background 0.15s;
  }

  .toggle-input:checked + .toggle-track {
    background: #f8c34a;
    border-color: #f8c34a;
  }

  .toggle-input:checked + .toggle-track::after {
    transform: translateX(14px);
    background: #0d0d0d;
  }
```

- [ ] **Step 5: Build to confirm no compile errors**

Run: `npm run build`
Expected: build completes successfully with no errors.

- [ ] **Step 6: Manually verify the table view**

Run: `npm run dev`, open `/other-players` in a browser. Confirm:
- Checking "Table View" replaces the card grid with a sortable table that includes a "Guild" column showing each player's tag (or "None").
- The guild dropdown still filters the table's rows the same way it filters the card grid.
- Unchecking "Table View" restores the card grid.
- Clicking column headers in the table sorts as expected, matching Guild Rankings' behavior.

- [ ] **Step 7: Commit**

```bash
git add src/routes/other-players/+page.svelte
git commit -m "feat: add Table View toggle to Other Players page"
```
