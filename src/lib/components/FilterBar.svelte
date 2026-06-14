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
    // raw is the PocketBase date string e.g. "2026-06-09 00:00:00.000Z"
    // Parse just the date part to avoid timezone shifts
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
    <select onchange={e => onEventTypeChange(e.target.value)}>
      {#each EVENT_TYPES as type}
        <option value={type} selected={type === eventType}>{type}</option>
      {/each}
    </select>
  </label>

  <label>
    Week of
    <select onchange={e => onWeekChange(e.target.value)}>
      {#each (weeks ?? []) as week}
        <option value={week} selected={week === selectedWeek}>{formatWeek(week)}</option>
      {/each}
    </select>
  </label>

  <label>
    Day
    <select onchange={e => onDayChange(e.target.value)}>
      {#each DAYS as day}
        <option value={day} selected={day === selectedDay}>{day}</option>
      {/each}
    </select>
  </label>
</div>
