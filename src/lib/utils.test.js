import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { filterByDay, sortRecords, formatRelativeTime } from './utils.js';

// Game day resets at 02:00 UTC. Records before 02:00 UTC belong to the previous game day.
// Mon Jun 8 game day = 02:00 Jun 8 UTC through 01:59 Jun 9 UTC
const RECORDS = [
  { rank: 1, player_name: 'Alice', score: 3000, captured_at: '2026-06-08T02:50:00.000Z' },
  { rank: 2, player_name: 'Bob',   score: 2000, captured_at: '2026-06-08T02:50:00.000Z' },
  { rank: 1, player_name: 'Alice', score: 3500, captured_at: '2026-06-09T02:50:00.000Z' },
  { rank: 2, player_name: 'Bob',   score: 2500, captured_at: '2026-06-09T02:50:00.000Z' },
];

describe('filterByDay', () => {
  test('All returns only records from the most recent game day', () => {
    const result = filterByDay(RECORDS, 'All');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.captured_at.startsWith('2026-06-09'))).toBe(true);
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

  test('All groups pre-02:00 UTC records with previous game day', () => {
    // Mix of 01:30 UTC Tue (game Mon) and 03:00 UTC Mon (game Mon) — same game day
    const mixed = [
      { rank: 1, player_name: 'Alice', score: 3000, captured_at: '2026-06-08T03:00:00.000Z' },
      { rank: 1, player_name: 'Alice', score: 3500, captured_at: '2026-06-09T01:30:00.000Z' },
    ];
    expect(filterByDay(mixed, 'All')).toHaveLength(2);
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
