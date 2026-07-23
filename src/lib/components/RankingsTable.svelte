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
      sortDir = col === 'player_name' || col === 'main_queue_faction' || col === 'guild_tag' || col === 'server' ? 'asc' : 'desc';
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
        {#if showGuildColumn}
          <th class="guild-col" onclick={() => toggleSort('guild_tag')}>Guild{indicator('guild_tag')}</th>
          <th class="guild-col" onclick={() => toggleSort('server')}>Server{indicator('server')}</th>
        {/if}
        <th onclick={() => toggleSort('influence')}>Influence{indicator('influence')}</th>
        <th onclick={() => toggleSort('castle_level')}>Castle{indicator('castle_level')}</th>
        <th onclick={() => toggleSort('main_queue_influence')}>MQ. Influence{indicator('main_queue_influence')}</th>
        <th onclick={() => toggleSort('main_queue_faction')}>Faction{indicator('main_queue_faction')}</th>
        <th class="activity-col" onclick={() => toggleSort('chat_activity')}>Activity{indicator('chat_activity')}</th>
      </tr>
    </thead>
    <tbody>
      {#each sorted as member, i (member.id)}
        <tr>
          <td>{i + 1}</td>
          <td>{member.player_name}</td>
          {#if showGuildColumn}
            <td class="guild-cell">{member.guild_tag || 'None'}</td>
            <td class="guild-cell">{member.server || 'None'}</td>
          {/if}
          <td>{abbrev(member.influence)}</td>
          <td>{member.castle_level}</td>
          <td>{abbrev(member.main_queue_influence)}</td>
          <td style="color:{FACTION_COLOR[member.main_queue_faction] ?? '#888'};">{member.main_queue_faction}</td>
          <td class="activity-cell">{member.chat_activity ?? '—'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .rank-col { cursor: default; }

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
