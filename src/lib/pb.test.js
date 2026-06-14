import { describe, test, expect, vi, afterEach } from 'vitest';

vi.mock('$env/static/public', () => ({ PUBLIC_PB_URL: 'http://localhost:8090' }));

// Import after mock is registered
const { getEventWeeks, getRecords } = await import('./pb.js');

function mockFetch(data, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

afterEach(() => vi.restoreAllMocks());

describe('getEventWeeks', () => {
  test('returns deduplicated event_start_date values in original sort order', async () => {
    vi.stubGlobal('fetch', mockFetch({
      items: [
        { event_start_date: '2026-06-09 00:00:00.000Z' },
        { event_start_date: '2026-06-09 00:00:00.000Z' },
        { event_start_date: '2026-06-02 00:00:00.000Z' },
      ]
    }));
    const result = await getEventWeeks('GAR');
    expect(result).toEqual(['2026-06-09 00:00:00.000Z', '2026-06-02 00:00:00.000Z']);
  });

  test('includes event_type in the filter', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getEventWeeks('GR');
    expect(fetchMock.mock.calls[0][0]).toContain("event_type='GR'");
  });

  test('requests only the event_start_date field', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getEventWeeks('KvK');
    expect(fetchMock.mock.calls[0][0]).toContain('fields=event_start_date');
  });

  test('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Not found' }, 404));
    await expect(getEventWeeks('GAR')).rejects.toThrow('404');
  });
});

describe('getRecords', () => {
  test('returns the items array from the PocketBase response', async () => {
    const items = [
      { rank: 1, player_name: 'Alice', score: 3000 },
      { rank: 2, player_name: 'Bob',   score: 2000 },
    ];
    vi.stubGlobal('fetch', mockFetch({ items }));
    const result = await getRecords('GAR', '2026-06-09 00:00:00.000Z');
    expect(result).toEqual(items);
  });

  test('includes both event_type and event_start_date in the filter', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getRecords('KvK', '2026-05-26 00:00:00.000Z');
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("event_type='KvK'");
    expect(url).toContain('2026-05-26');
  });

  test('sorts results by rank', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getRecords('GAR', '2026-06-09 00:00:00.000Z');
    expect(fetchMock.mock.calls[0][0]).toContain('sort=rank');
  });

  test('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Forbidden' }, 403));
    await expect(getRecords('GAR', '2026-06-09 00:00:00.000Z')).rejects.toThrow('403');
  });
});
