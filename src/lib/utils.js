export function abbrev(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + ' k';
  return String(n);
}

const DAY_NAMES = [null, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GAME_DAY_OFFSET_MS = 2 * 3_600_000; // game day resets at 02:00 UTC
const NAME_SIMILARITY_THRESHOLD = 0.75;

function aggregateByPlayer(records) {
  const sorted = [...records].sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  const clusters = [];
  for (const r of sorted) {
    const cluster = clusters.find(c => similarity(c.latest.player_name, r.player_name) >= NAME_SIMILARITY_THRESHOLD);
    if (cluster) {
      cluster.score += r.score;
      cluster.latest = r;
    } else {
      clusters.push({ score: r.score, latest: r });
    }
  }
  const aggregated = clusters.map(c => ({ ...c.latest, score: c.score }));
  aggregated.sort((a, b) => b.score - a.score);
  aggregated.forEach((r, i) => { r.rank = i + 1; });
  return aggregated;
}

export function filterByDay(records, day) {
  if (records.length === 0) return [];
  if (day === 'All') {
    return aggregateByPlayer(records);
  }
  const targetIndex = DAY_NAMES.indexOf(day);
  if (targetIndex === -1) return [];
  return records.filter(r =>
    new Date(new Date(r.captured_at).getTime() - GAME_DAY_OFFSET_MS).getUTCDay() === targetIndex
  );
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[b.length];
}

function normalize(s) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function similarity(a, b) {
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  return (maxLen - editDistance(s1, s2)) / maxLen;
}

export function matchRosterToEvent(rosterMembers, eventRecords, threshold = NAME_SIMILARITY_THRESHOLD) {
  const usedIds = new Set();
  return rosterMembers.map(member => {
    let best = 0, bestRecord = null;
    for (const record of eventRecords) {
      if (usedIds.has(record.id)) continue;
      const s = similarity(member.player_name, record.player_name);
      if (s > best) { best = s; bestRecord = record; }
    }
    if (best >= threshold && bestRecord) {
      usedIds.add(bestRecord.id);
      return { member, eventRecord: bestRecord };
    }
    return { member, eventRecord: null };
  });
}

const ACTIVITY_ORDER = { hyperactive: 4, active: 3, daily: 2, weekly: 1, none: 0 };

export function sortRecords(records, column, direction) {
  const sorted = [...records].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];
    if (column === 'chat_activity') {
      return (ACTIVITY_ORDER[aVal] ?? -1) - (ACTIVITY_ORDER[bVal] ?? -1);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
    return String(aVal).localeCompare(String(bVal));
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return 'unknown';
  const diff = Date.now() - new Date(dateStr.replace(/\s/, 'T')).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
