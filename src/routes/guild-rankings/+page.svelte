<script>
  import { onMount } from 'svelte';
  import { getRosterMembers } from '$lib/pb.js';
  import { sortRecords } from '$lib/utils.js';

  const FACTION_COLOR = {
    Horde:  '#ff8060',
    League: '#60aaff',
    Nature: '#60d060',
  };

  function abbrev(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + ' k';
    return String(n);
  }

  let members = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let sortCol = $state('influence');
  let sortDir = $state('desc');

  const sorted = $derived(sortRecords(members, sortCol, sortDir));

  function toggleSort(col) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'player_name' || col === 'main_queue_faction' ? 'asc' : 'desc';
    }
  }

  function indicator(col) {
    if (sortCol !== col) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }

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
{:else if sorted.length === 0}
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
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .rank-col { cursor: default; }
</style>
