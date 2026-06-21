<script>
  import { onMount } from 'svelte';
  import { getCastleLayouts, getLayoutImageUrl } from '$lib/pb.js';

  let layouts = $state([]);
  let selectedId = $state('');
  let zoom = $state(1);
  let loading = $state(false);
  let error = $state(null);

  const selected = $derived(layouts.find(l => l.id === selectedId) ?? null);
  const imageUrl = $derived(selected ? getLayoutImageUrl(selected) : null);

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr.replace(/\s/, 'T')).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  function zoomIn() { zoom = Math.min(4, +(zoom + 0.25).toFixed(2)); }
  function zoomOut() { zoom = Math.max(0.25, +(zoom - 0.25).toFixed(2)); }
  function resetZoom() { zoom = 1; }

  function handleWheel(e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }

  onMount(async () => {
    loading = true;
    error = null;
    try {
      layouts = await getCastleLayouts();
      if (layouts.length > 0) selectedId = layouts[0].id;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="page">
  <div class="toolbar">
    <div class="selector-wrap">
      <span class="selector-label">Layout Date</span>
      <select
        bind:value={selectedId}
        onchange={() => { zoom = 1; }}
        class="date-select"
        disabled={layouts.length === 0}
      >
        {#each layouts as layout (layout.id)}
          <option value={layout.id}>{formatDate(layout.created)}</option>
        {/each}
      </select>
    </div>
    <div class="zoom-controls">
      <button onclick={zoomOut} disabled={zoom <= 0.25} aria-label="Zoom out">−</button>
      <button class="zoom-pct" onclick={resetZoom} title="Reset zoom">{Math.round(zoom * 100)}%</button>
      <button onclick={zoomIn} disabled={zoom >= 4} aria-label="Zoom in">+</button>
    </div>
  </div>
  <p class="hint">Ctrl + scroll to zoom</p>

  {#if loading}
    <p class="status">Loading…</p>
  {:else if error}
    <p class="status error">{error}</p>
  {:else if !imageUrl}
    <p class="status">No castle layouts found.</p>
  {:else}
    <div class="viewport" onwheel={handleWheel}>
      <img
        src={imageUrl}
        alt="Castle Layout — {formatDate(selected?.created)}"
        style="width: {zoom * 100}%; max-width: none;"
        draggable="false"
      />
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: calc(100vh - 4rem);
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    flex-shrink: 0;
  }

  .selector-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .selector-label {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .date-select {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    color: #e0e0e0;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    min-width: 200px;
    cursor: pointer;
  }

  .date-select:focus { outline: none; border-color: #444; }
  .date-select:disabled { opacity: 0.5; cursor: not-allowed; }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .zoom-controls button {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    color: #e0e0e0;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    line-height: 1;
    transition: background 0.15s;
  }

  .zoom-controls button:hover:not(:disabled) { background: #252525; }
  .zoom-controls button:disabled { opacity: 0.4; cursor: not-allowed; }

  .zoom-pct {
    min-width: 60px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .hint {
    font-size: 11px;
    color: #3a3a3a;
    margin: 0;
    flex-shrink: 0;
  }

  .viewport {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: #0d0d0d;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
  }

  .viewport img {
    display: block;
    user-select: none;
  }

  .status {
    padding: 2rem;
    color: #666;
    text-align: center;
  }

  .status.error { color: #f87a4a; }
</style>
