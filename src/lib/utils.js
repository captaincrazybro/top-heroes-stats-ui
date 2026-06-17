const DAY_NAMES = [null, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
    return String(aVal).localeCompare(String(bVal));
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr.replace(/\s/, 'T')).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
