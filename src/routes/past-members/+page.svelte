<script>
  import { onMount } from 'svelte';
  import { getPastMembers } from '$lib/pb.js';
  import RosterCard from '$lib/components/RosterCard.svelte';

  let members = $state([]);
  let loading = $state(false);
  let error = $state(null);

  onMount(async () => {
    loading = true;
    error = null;
    try {
      const result = await getPastMembers();
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
  <p class="status">No past members found.</p>
{:else}
  <p class="member-count">{members.length} past {members.length === 1 ? 'member' : 'members'}</p>
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
