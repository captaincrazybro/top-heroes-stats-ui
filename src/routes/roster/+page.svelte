<script>
  import { onMount } from 'svelte';
  import { getRosterMembers } from '$lib/pb.js';
  import RosterCard from '$lib/components/RosterCard.svelte';

  const RANKS = ['R5', 'R4', 'R3', 'R2', 'R1'];

  let members = $state([]);
  let lastUpdated = $state('');
  let loading = $state(false);
  let error = $state(null);

  const grouped = $derived(
    RANKS.reduce((acc, rank) => {
      acc[rank] = members.filter(m => m.rank === rank);
      return acc;
    }, {})
  );

  function formatLastUpdated(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr.replace(/\s/, 'T')).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  onMount(async () => {
    loading = true;
    error = null;
    try {
      const result = await getRosterMembers();
      members = result.members;
      lastUpdated = result.lastUpdated;
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
  {#if lastUpdated}
    <p class="last-updated">Roster last updated: {formatLastUpdated(lastUpdated)}</p>
  {/if}

  {#if grouped['R5'].length > 0}
    <section class="role-section">
      <div class="role-header">Guild Master</div>
      <RosterCard member={grouped['R5'][0]} variant="master" />
    </section>
  {/if}

  {#each ['R4', 'R3', 'R2', 'R1'] as rank}
    {#if grouped[rank].length > 0}
      <section class="role-section">
        <div class="role-divider">
          <span class="role-label">{rank}</span>
          <div class="role-line"></div>
        </div>
        <div class="roster-grid">
          {#each grouped[rank] as member (member.id)}
            <RosterCard {member} />
          {/each}
        </div>
      </section>
    {/if}
  {/each}
{/if}

<style>
  .last-updated {
    font-size: 12px;
    color: #555;
    margin-bottom: 24px;
  }

  .role-section { margin-bottom: 32px; }

  .role-header {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: .1em;
    margin-bottom: 12px;
  }

  .role-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .role-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: .1em;
    white-space: nowrap;
  }

  .role-line { flex: 1; height: 1px; background: #222; }

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
