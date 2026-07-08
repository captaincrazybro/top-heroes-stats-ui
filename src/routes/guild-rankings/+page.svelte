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
