import { describe, test, expect } from 'vitest';
import { filterByDay, sortRecords } from './utils.js';

// Mon Jun 8 = UTC day 1, Tue Jun 9 = UTC day 2
const RECORDS = [
  { rank: 1, player_name: 'Alice', score: 3000, captured_at: '2026-06-08T02:50:00.000Z' },
  { rank: 2, player_name: 'Bob',   score: 2000, captured_at: '2026-06-08T02:50:00.000Z' },
  { rank: 1, player_name: 'Alice', score: 3500, captured_at: '2026-06-09T02:50:00.000Z' },
  { rank: 2, player_name: 'Bob',   score: 2500, captured_at: '2026-06-09T02:50:00.000Z' },
];

describe('filterByDay', () => {
  test('All returns only records from the most recent captured_at date', () => {
    const result = filterByDay(RECORDS, 'All');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.captured_at.startsWith('2026-06-09'))).toBe(true);
  });

  test('Mon returns records captured on Monday UTC', () => {
    const result = filterByDay(RECORDS, 'Mon');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.captured_at.startsWith('2026-06-08'))).toBe(true);
  });

  test('Tue returns records captured on Tuesday UTC', () => {
    const result = filterByDay(RECORDS, 'Tue');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.captured_at.startsWith('2026-06-09'))).toBe(true);
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
