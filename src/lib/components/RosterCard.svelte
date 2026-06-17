<script>
  let { member, variant = 'standard' } = $props();

  let showModal = $state(false);

  function abbrev(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + ' k';
    return String(n);
  }

  const FACTION = {
    Horde:  { bg: '#3a1e1e', color: '#ff8060', border: '#6b3030', icon: '⚔' },
    League: { bg: '#1e3a5f', color: '#60aaff', border: '#2a5080', icon: '🛡' },
    Nature: { bg: '#1e2e1e', color: '#60d060', border: '#306030', icon: '🌿' },
  };

  const faction = $derived(FACTION[member.main_queue_faction] ?? { bg: '#222', color: '#888', border: '#333', icon: '?' });
  const topBorder = $derived(member.rank === 'R4' ? '#c0a040' : 'transparent');

  function onKeydown(e) {
    if (e.key === 'Escape') showModal = false;
  }
</script>

{#if variant === 'master'}
  <div class="master-card" role="button" tabindex="0" onclick={() => showModal = true} onkeydown={onKeydown}>
    <div class="master-badge">
      <span class="master-role">R5</span>
      <span class="master-crown">👑</span>
    </div>
    <div class="master-info">
      <div class="master-name">{member.player_name}</div>
      <div class="master-meta">
        <span>Level <strong>{member.level}</strong></span>
        <span>Castle <strong>{member.castle_level}</strong></span>
      </div>
      <div class="master-online">Last online: {member.last_online}</div>
      <div class="card-hint">Click card for more details…</div>
    </div>
    <div class="master-influence">
      <div class="inf-label">Influence</div>
      <div class="inf-value">{abbrev(member.influence)}</div>
    </div>
  </div>
{:else}
  <div class="roster-card" style="border-top-color:{topBorder};" role="button" tabindex="0" onclick={() => showModal = true} onkeydown={onKeydown}>
    <div class="card-name">{member.player_name}</div>
    <div class="card-stats">
      <div><div class="stat-label">Level</div><div class="stat-val">{member.level}</div></div>
      <div><div class="stat-label">Castle</div><div class="stat-val">{member.castle_level}</div></div>
      <div><div class="stat-label">Influence</div><div class="stat-val green">{abbrev(member.influence)}</div></div>
      <div><div class="stat-label hint-label">Click card for more details…</div></div>
    </div>
    <div class="card-footer">
      <span class="last-online">{member.last_online}</span>
    </div>
  </div>
{/if}

{#if showModal}
  <div class="modal-overlay" onclick={() => showModal = false} onkeydown={onKeydown} role="button" tabindex="-1">
    <div class="modal-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-name">{member.player_name}</div>
        <button class="modal-close" onclick={() => showModal = false}>✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-row">
          <span class="modal-label">Main Queue Faction</span>
          <span
            class="faction-badge"
            style="background:{faction.bg};color:{faction.color};border-color:{faction.border};"
          >{faction.icon} {member.main_queue_faction}</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Main Queue Influence</span>
          <span class="modal-val green">{abbrev(member.main_queue_influence)}</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Recent Ranked</span>
          <span class="modal-val">{member.recent_ranked_match_ranking ?? '—'}</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Language</span>
          <span class="modal-val">{member.language ?? '—'}</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Timezone</span>
          <span class="modal-val">{member.timezone ?? '—'}</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ── Guild Master card ───────────────────────── */
  .master-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 20px;
    align-items: center;
    max-width: 520px;
    background: linear-gradient(135deg, #1f1a00, #1a1a1a);
    border: 1px solid #5a4500;
    border-radius: 12px;
    padding: 20px 24px;
    box-shadow: 0 0 24px rgba(248, 195, 74, 0.08);
    cursor: pointer;
    transition: box-shadow 0.15s;
  }

  .master-card:hover {
    box-shadow: 0 0 32px rgba(248, 195, 74, 0.16);
  }

  .master-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .master-role {
    font-size: 11px;
    color: #f8c34a;
    text-transform: uppercase;
    letter-spacing: .1em;
  }

  .master-crown { font-size: 28px; }

  .master-name {
    font-size: 20px;
    font-weight: 800;
    color: #f8c34a;
    letter-spacing: .02em;
    margin-bottom: 8px;
  }

  .master-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
  }

  .master-meta strong { color: #e0e0e0; }

  .master-online { font-size: 11px; color: #555; margin-bottom: 4px; }

  .master-influence { text-align: right; }

  .inf-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: 2px;
  }

  .inf-value { font-size: 20px; font-weight: 700; color: #4af87a; }

  /* ── Standard card ───────────────────────────── */
  .roster-card {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-top: 3px solid transparent;
    border-radius: 8px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .roster-card:hover { background: #202020; }

  .card-name { font-size: 15px; font-weight: 700; color: #e0e0e0; }

  .card-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    font-size: 11px;
  }

  .stat-label { color: #555; }
  .stat-val { color: #e0e0e0; font-weight: 600; }
  .stat-val.green { color: #4af87a; }

  .hint-label {
    color: #444;
    font-style: italic;
    font-size: 10px;
    margin-top: 2px;
  }

  .card-hint {
    font-size: 10px;
    color: #444;
    font-style: italic;
  }

  .card-footer { font-size: 10px; color: #555; }

  /* ── Modal ───────────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-card {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    width: min(360px, 90vw);
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-name {
    font-size: 17px;
    font-weight: 700;
    color: #e0e0e0;
  }

  .modal-close {
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .modal-close:hover { color: #e0e0e0; background: #2a2a2a; }

  .modal-body { display: flex; flex-direction: column; gap: 10px; }

  .modal-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }

  .modal-label { color: #666; }
  .modal-val { color: #e0e0e0; font-weight: 600; }
  .modal-val.green { color: #4af87a; }

  /* ── Shared ──────────────────────────────────── */
  .faction-badge {
    display: inline-block;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid;
    font-weight: 500;
  }
</style>
