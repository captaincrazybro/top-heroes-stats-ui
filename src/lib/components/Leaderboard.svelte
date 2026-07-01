<script>
  import { sortRecords } from '$lib/utils.js';

  let { records = [], loading = false, error = null, useGuildRank = false } = $props();

  let sortCol = $state('rank');
  let sortDir = $state('asc');

  const sorted = $derived(sortRecords(records, sortCol, sortDir));

  function toggleSort(col) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'score' ? 'desc' : 'asc';
    }
  }

  function indicator(col) {
    if (sortCol !== col) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }
</script>

<div class="leaderboard">
  {#if loading}
    <p class="status">Loading...</p>
  {:else if error}
    <p class="status error">{error}</p>
  {:else if sorted.length === 0}
    <p class="status">No records found.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th onclick={() => toggleSort('rank')}>{useGuildRank ? 'Guild Rank' : 'Event Rank'}{indicator('rank')}</th>
          <th onclick={() => toggleSort('player_name')}>Player{indicator('player_name')}</th>
          <th onclick={() => toggleSort('score')}>Score{indicator('score')}</th>
        </tr>
      </thead>
      <tbody>
        {#each sorted as row, i (row.id)}
          <tr class:not-in-event={row.notInEvent}>
            <td>{useGuildRank ? i + 1 : (row.notInEvent ? '—' : row.rank)}</td>
            <td>{row.player_name}</td>
            <td>{row.notInEvent ? '—' : row.score.toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .not-in-event td { color: #555; }
</style>
