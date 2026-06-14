<script>
  const DAYS        = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const EVENT_TYPES = ['GAR', 'GR', 'KvK'];

  let {
    eventType,
    weeks,
    selectedWeek,
    selectedDay,
    onEventTypeChange,
    onWeekChange,
    onDayChange,
  } = $props();

  function formatWeek(raw) {
    if (!raw) return '';
    const [datePart] = raw.split(' ');
    const d = new Date(datePart + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    });
  }
</script>

<div class="filter-bar">
  <label>
    Week of
    <select value={selectedWeek} onchange={e => onWeekChange(e.target.value)}>
      {#each (weeks ?? []) as week}
        <option value={week}>{formatWeek(week)}</option>
      {/each}
    </select>
  </label>

  <div class="tab-group">
    <span class="tab-label">Event</span>
    <div class="tabs">
      {#each EVENT_TYPES as type}
        <button
          class="tab"
          class:active={type === eventType}
          onclick={() => onEventTypeChange(type)}
        >{type}</button>
      {/each}
    </div>
  </div>

  <div class="tab-group">
    <span class="tab-label">Day</span>
    <div class="tabs">
      {#each DAYS as day}
        <button
          class="tab"
          class:active={day === selectedDay}
          onclick={() => onDayChange(day)}
        >{day}</button>
      {/each}
    </div>
  </div>
</div>

<style>
  .tab-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tab-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tabs {
    display: flex;
  }

  .tab {
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #444;
    border-right: none;
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
    cursor: pointer;
    line-height: 1;
  }

  .tab:first-child { border-radius: 4px 0 0 4px; }
  .tab:last-child  { border-radius: 0 4px 4px 0; border-right: 1px solid #444; }

  .tab:hover { border-color: #888; z-index: 1; }

  .tab.active {
    background: #f8c34a;
    color: #0d0d0d;
    border-color: #f8c34a;
    font-weight: 600;
    z-index: 1;
  }

  .tab.active + .tab { border-left-color: #f8c34a; }
</style>
