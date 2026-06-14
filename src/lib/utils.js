const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function filterByDay(records, day) {
  if (records.length === 0) return [];
  if (day === 'All') {
    const latestDate = records
      .map(r => r.captured_at.slice(0, 10))
      .sort()
      .at(-1);
    return records.filter(r => r.captured_at.startsWith(latestDate));
  }
  const targetIndex = DAY_NAMES.indexOf(day);
  if (targetIndex === -1) return [];
  return records.filter(r => new Date(r.captured_at).getUTCDay() === targetIndex);
}

export function sortRecords(records, column, direction) {
  const sorted = [...records].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];
    if (typeof aVal === 'number') return aVal - bVal;
    return String(aVal).localeCompare(String(bVal));
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}
