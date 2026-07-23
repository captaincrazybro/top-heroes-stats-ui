<script>
  import { onMount } from 'svelte';
  import { getAllGuildMembers } from '$lib/pb.js';
  import RosterCard from '$lib/components/RosterCard.svelte';
  import RankingsTable from '$lib/components/RankingsTable.svelte';

  let allMembers = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let selectedGuild = $state('All');
  let tableView = $state(false);
  let includeGuild = $state(false);

  const members = $derived(allMembers.filter(m => !m.joined));
  const currentMembers = $derived(allMembers.filter(m => m.joined));

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

  const displayMembers = $derived.by(() => {
    if (!includeGuild) return filteredMembers;
    const ids = new Set(filteredMembers.map(m => m.id));
    return [...filteredMembers, ...currentMembers.filter(m => !ids.has(m.id))];
  });

  onMount(async () => {
    loading = true;
    error = null;
    try {
      allMembers = await getAllGuildMembers();
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

    <label class="toggle-group">
      Include Guild
      <input type="checkbox" class="toggle-input" checked={includeGuild} onchange={e => includeGuild = e.target.checked} />
      <span class="toggle-track"></span>
    </label>
  </div>

  {#if displayMembers.length === 0}
    <p class="status">
      {members.length === 0 ? 'No other players found.' : 'No other players found for this guild.'}
    </p>
  {:else}
    <p class="member-count">{displayMembers.length} other {displayMembers.length === 1 ? 'player' : 'players'}</p>
    {#if tableView}
      <RankingsTable members={displayMembers} showGuildColumn={true} />
    {:else}
      <div class="roster-grid">
        {#each displayMembers as member (member.id)}
          <RosterCard {member} showGuildTag={true} />
        {/each}
      </div>
    {/if}
  {/if}
{/if}

<style>
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
