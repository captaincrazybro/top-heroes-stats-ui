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
    Event
    <select value={eventType} onchange={e => onEventTypeChange(e.target.value)}>
      {#each EVENT_TYPES as type}
        <option value={type}>{type}</option>
      {/each}
    </select>
  </label>

  <label>
    Week of
    <select value={selectedWeek} onchange={e => onWeekChange(e.target.value)}>
      {#each (weeks ?? []) as week}
        <option value={week}>{formatWeek(week)}</option>
      {/each}
    </select>
  </label>

  <div class="day-group">
    <span class="day-label">Day</span>
    <div class="day-tabs">
      {#each DAYS as day}
        <button
          class="day-tab"
          class:active={day === selectedDay}
          onclick={() => onDayChange(day)}
        >{day}</button>
      {/each}
    </div>
  </div>
</div>

<style>
  .day-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .day-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .day-tabs {
    display: flex;
  }

  .day-tab {
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #444;
    border-right: none;
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
    cursor: pointer;
    line-height: 1;
  }

  .day-tab:first-child { border-radius: 4px 0 0 4px; }
  .day-tab:last-child  { border-radius: 0 4px 4px 0; border-right: 1px solid #444; }

  .day-tab:hover { border-color: #888; z-index: 1; }

  .day-tab.active {
    background: #f8c34a;
    color: #0d0d0d;
    border-color: #f8c34a;
    font-weight: 600;
    z-index: 1;
  }

  .day-tab.active + .day-tab { border-left-color: #f8c34a; }
</style>
