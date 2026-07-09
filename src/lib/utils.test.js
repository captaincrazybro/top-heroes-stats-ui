import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { filterByDay, sortRecords, formatRelativeTime, similarity, matchRosterToEvent } from './utils.js';

// Game day resets at 02:00 UTC. Records before 02:00 UTC belong to the previous game day.
// Mon Jun 8 game day = 02:00 Jun 8 UTC through 01:59 Jun 9 UTC
const RECORDS = [
  { rank: 1, player_name: 'Alice', score: 3000, captured_at: '2026-06-08T02:50:00.000Z' },
  { rank: 2, player_name: 'Bob',   score: 2000, captured_at: '2026-06-08T02:50:00.000Z' },
  { rank: 1, player_name: 'Alice', score: 3500, captured_at: '2026-06-09T02:50:00.000Z' },
  { rank: 2, player_name: 'Bob',   score: 2500, captured_at: '2026-06-09T02:50:00.000Z' },
];

describe('filterByDay', () => {
  test('All sums each player\'s score across every record and ranks by total descending', () => {
    const result = filterByDay(RECORDS, 'All');
    expect(result).toHaveLength(2);
    const alice = result.find(r => r.player_name === 'Alice');
    const bob = result.find(r => r.player_name === 'Bob');
    expect(alice.score).toBe(6500); // 3000 + 3500
    expect(bob.score).toBe(4500);   // 2000 + 2500
    expect(alice.rank).toBe(1);
    expect(bob.rank).toBe(2);
  });

  test('All keeps id and guild_tag from the most recently captured record per player', () => {
    const records = [
      { id: 'e1', rank: 5, player_name: 'Alice', score: 1000, guild_tag: 'HGS', captured_at: '2026-06-08T02:00:00.000Z' },
      { id: 'e2', rank: 3, player_name: 'Alice', score: 2000, guild_tag: 'HGS', captured_at: '2026-06-09T02:00:00.000Z' },
    ];
    const result = filterByDay(records, 'All');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e2');
    expect(result[0].guild_tag).toBe('HGS');
    expect(result[0].score).toBe(3000);
  });

  test('Mon returns records captured during Monday game day', () => {
    const result = filterByDay(RECORDS, 'Mon');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.captured_at.startsWith('2026-06-08'))).toBe(true);
  });

  test('Tue returns records captured during Tuesday game day', () => {
    const result = filterByDay(RECORDS, 'Tue');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.captured_at.startsWith('2026-06-09'))).toBe(true);
  });

  test('records before 02:00 UTC belong to the previous game day', () => {
    // 01:30 UTC Tuesday is still Monday game day
    const earlyRecords = [
      { rank: 1, player_name: 'Alice', score: 3000, captured_at: '2026-06-09T01:30:00.000Z' },
    ];
    expect(filterByDay(earlyRecords, 'Mon')).toHaveLength(1);
    expect(filterByDay(earlyRecords, 'Tue')).toHaveLength(0);
  });

  test('records at exactly 02:00 UTC start the new game day', () => {
    const resetRecords = [
      { rank: 1, player_name: 'Alice', score: 3000, captured_at: '2026-06-09T02:00:00.000Z' },
    ];
    expect(filterByDay(resetRecords, 'Tue')).toHaveLength(1);
    expect(filterByDay(resetRecords, 'Mon')).toHaveLength(0);
  });

  test('All combines multiple records for the same player into one summed row', () => {
    const repeated = [
      { rank: 1, player_name: 'Alice', score: 3000, captured_at: '2026-06-08T03:00:00.000Z' },
      { rank: 1, player_name: 'Alice', score: 3500, captured_at: '2026-06-09T01:30:00.000Z' },
    ];
    const result = filterByDay(repeated, 'All');
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(6500);
  });

  test('returns empty array for empty input on All', () => {
    expect(filterByDay([], 'All')).toEqual([]);
  });

  test('returns empty array when no records match the day', () => {
    expect(filterByDay(RECORDS, 'Wed')).toEqual([]);
  });

  test('returns empty array for Sun (not a valid day in the app)', () => {
    expect(filterByDay(RECORDS, 'Sun')).toEqual([]);
  });
});

describe('sortRecords', () => {
  const records = [
    { rank: 3, player_name: 'Charlie', score: 1000 },
    { rank: 1, player_name: 'Alice',   score: 3000 },
    { rank: 2, player_name: 'Bob',     score: 2000 },
  ];

  test('sorts by rank ascending', () => {
    const result = sortRecords(records, 'rank', 'asc');
    expect(result.map(r => r.rank)).toEqual([1, 2, 3]);
  });

  test('sorts by rank descending', () => {
    const result = sortRecords(records, 'rank', 'desc');
    expect(result.map(r => r.rank)).toEqual([3, 2, 1]);
  });

  test('sorts by score descending', () => {
    const result = sortRecords(records, 'score', 'desc');
    expect(result.map(r => r.score)).toEqual([3000, 2000, 1000]);
  });

  test('sorts by player_name ascending', () => {
    const result = sortRecords(records, 'player_name', 'asc');
    expect(result.map(r => r.player_name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  test('does not mutate the input array', () => {
    const original = records.map(r => ({ ...r }));
    sortRecords(records, 'rank', 'desc');
    expect(records).toEqual(original);
  });

  test('sorts chat_activity by activity level descending (hyperactive first)', () => {
    const activity = [
      { id: '1', player_name: 'A', chat_activity: 'weekly' },
      { id: '2', player_name: 'B', chat_activity: 'hyperactive' },
      { id: '3', player_name: 'C', chat_activity: 'daily' },
      { id: '4', player_name: 'D', chat_activity: 'none' },
      { id: '5', player_name: 'E', chat_activity: 'active' },
    ];
    const result = sortRecords(activity, 'chat_activity', 'desc');
    expect(result.map(r => r.chat_activity)).toEqual(['hyperactive', 'active', 'daily', 'weekly', 'none']);
  });

  test('sorts chat_activity ascending (none first)', () => {
    const activity = [
      { id: '1', player_name: 'A', chat_activity: 'active' },
      { id: '2', player_name: 'B', chat_activity: 'none' },
      { id: '3', player_name: 'C', chat_activity: 'hyperactive' },
    ];
    const result = sortRecords(activity, 'chat_activity', 'asc');
    expect(result.map(r => r.chat_activity)).toEqual(['none', 'active', 'hyperactive']);
  });
});

describe('similarity', () => {
  test('identical strings return 1', () => {
    expect(similarity('Alice', 'Alice')).toBe(1);
  });

  test('case insensitive', () => {
    expect(similarity('alice', 'ALICE')).toBe(1);
  });

  test('trims whitespace', () => {
    expect(similarity(' alice ', 'alice')).toBe(1);
  });

  test('one character difference scores high', () => {
    expect(similarity('Alicee', 'Alice')).toBeGreaterThan(0.8);
  });

  test('completely different strings score low', () => {
    expect(similarity('Alice', 'Zxqrst')).toBeLessThan(0.4);
  });

  test('empty strings return 1', () => {
    expect(similarity('', '')).toBe(1);
  });

  test('ignores emojis', () => {
    expect(similarity('🔥Alice', 'Alice')).toBe(1);
  });

  test('ignores whitespace', () => {
    expect(similarity('Alice Smith', 'AliceSmith')).toBe(1);
  });

  test('ignores special characters', () => {
    expect(similarity('Alice_99!', 'Alice99')).toBe(1);
  });

  test('preserves accented letters', () => {
    expect(similarity('Álice', 'álice')).toBe(1);
  });
});

describe('matchRosterToEvent', () => {
  // 'Bobb' vs 'Bobby': editDistance=1, similarity=0.8 — above threshold
  // 'Charlie' has no close match — below threshold
  const roster = [
    { id: 'r1', player_name: 'Alice' },
    { id: 'r2', player_name: 'Bobb' },
    { id: 'r3', player_name: 'Charlie' },
  ];
  const events = [
    { id: 'e1', player_name: 'Alice', score: 3000, rank: 1 },
    { id: 'e2', player_name: 'Bobby', score: 2000, rank: 2 },
  ];

  test('exact match is found', () => {
    const result = matchRosterToEvent(roster, events);
    const alice = result.find(m => m.member.id === 'r1');
    expect(alice.eventRecord.id).toBe('e1');
  });

  test('fuzzy match finds name with one character difference', () => {
    const result = matchRosterToEvent(roster, events);
    const bobb = result.find(m => m.member.id === 'r2');
    expect(bobb.eventRecord.id).toBe('e2');
  });

  test('unmatched member has null eventRecord', () => {
    const result = matchRosterToEvent(roster, events);
    const charlie = result.find(m => m.member.id === 'r3');
    expect(charlie.eventRecord).toBeNull();
  });

  test('each event record matched to at most one roster member', () => {
    const result = matchRosterToEvent(roster, events);
    const matchedEventIds = result
      .filter(m => m.eventRecord)
      .map(m => m.eventRecord.id);
    const unique = new Set(matchedEventIds);
    expect(unique.size).toBe(matchedEventIds.length);
  });

  test('returns same length as roster', () => {
    const result = matchRosterToEvent(roster, events);
    expect(result).toHaveLength(roster.length);
  });

  test('no match when roster is empty', () => {
    expect(matchRosterToEvent([], events)).toEqual([]);
  });

  test('all unmatched when event list is empty', () => {
    const result = matchRosterToEvent(roster, []);
    expect(result.every(m => m.eventRecord === null)).toBe(true);
  });

  test('name below threshold is not matched', () => {
    const result = matchRosterToEvent(
      [{ id: 'r1', player_name: 'Zyx' }],
      [{ id: 'e1', player_name: 'Alice', score: 100, rank: 1 }],
    );
    expect(result[0].eventRecord).toBeNull();
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('returns "just now" for under 1 minute', () => {
    vi.setSystemTime(new Date('2026-06-17T12:00:30Z'));
    expect(formatRelativeTime('2026-06-17 12:00:00.000Z')).toBe('just now');
  });

  test('returns "1 minute ago" for exactly 1 minute', () => {
    vi.setSystemTime(new Date('2026-06-17T12:01:00Z'));
    expect(formatRelativeTime('2026-06-17 12:00:00.000Z')).toBe('1 minute ago');
  });

  test('returns "X minutes ago" for under 1 hour', () => {
    vi.setSystemTime(new Date('2026-06-17T12:30:00Z'));
    expect(formatRelativeTime('2026-06-17 12:00:00.000Z')).toBe('30 minutes ago');
  });

  test('returns "1 hour ago" for exactly 1 hour', () => {
    vi.setSystemTime(new Date('2026-06-17T13:00:00Z'));
    expect(formatRelativeTime('2026-06-17 12:00:00.000Z')).toBe('1 hour ago');
  });

  test('returns "X hours ago" for under 24 hours', () => {
    vi.setSystemTime(new Date('2026-06-17T17:00:00Z'));
    expect(formatRelativeTime('2026-06-17 12:00:00.000Z')).toBe('5 hours ago');
  });

  test('returns "1 day ago" for exactly 1 day', () => {
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));
    expect(formatRelativeTime('2026-06-17 12:00:00.000Z')).toBe('1 day ago');
  });

  test('returns "X days ago" for multiple days', () => {
    vi.setSystemTime(new Date('2026-06-20T12:00:00Z'));
    expect(formatRelativeTime('2026-06-17 12:00:00.000Z')).toBe('3 days ago');
  });
});
