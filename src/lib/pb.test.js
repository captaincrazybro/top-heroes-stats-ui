import { describe, test, expect, vi, afterEach } from 'vitest';

vi.mock('$env/static/public', () => ({ PUBLIC_PB_URL: 'http://localhost:8090' }));

// Import after mock is registered
const { getEventOptions, getRecords, getRosterMembers, getOtherPlayers } = await import('./pb.js');

function mockFetch(data, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mockFetchSequence(responses) {
  const fn = vi.fn();
  for (const { data, status = 200 } of responses) {
    fn.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  }
  return fn;
}

afterEach(() => vi.restoreAllMocks());

describe('getEventOptions', () => {
  test('returns deduplicated {eventType, week} pairs in sort order', async () => {
    vi.stubGlobal('fetch', mockFetch({
      items: [
        { event_type: 'GAR', event_start_date: '2026-06-09 00:00:00.000Z' },
        { event_type: 'GAR', event_start_date: '2026-06-09 00:00:00.000Z' },
        { event_type: 'GR',  event_start_date: '2026-06-02 00:00:00.000Z' },
      ]
    }));
    const result = await getEventOptions();
    expect(result).toEqual([
      { eventType: 'GAR', week: '2026-06-09' },
      { eventType: 'GR',  week: '2026-06-02' },
    ]);
  });

  test('deduplicates by eventType+week pair', async () => {
    vi.stubGlobal('fetch', mockFetch({
      items: [
        { event_type: 'GAR', event_start_date: '2026-06-09 00:00:00.000Z' },
        { event_type: 'GR',  event_start_date: '2026-06-09 00:00:00.000Z' },
        { event_type: 'GAR', event_start_date: '2026-06-09 00:00:00.000Z' },
      ]
    }));
    const result = await getEventOptions();
    expect(result).toHaveLength(2);
  });

  test('requests event_type and event_start_date fields', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getEventOptions();
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('fields=event_type,event_start_date');
    expect(url).toContain('perPage=500');
  });

  test('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Not found' }, 404));
    await expect(getEventOptions()).rejects.toThrow('404');
  });
});

describe('getRecords', () => {
  test('returns the items array from the PocketBase response', async () => {
    const items = [
      { rank: 1, player_name: 'Alice', score: 3000 },
      { rank: 2, player_name: 'Bob',   score: 2000 },
    ];
    vi.stubGlobal('fetch', mockFetch({ items }));
    const result = await getRecords('GAR', '2026-06-09');
    expect(result).toEqual(items);
  });

  test('includes both event_type and event_start_date in the filter', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getRecords('KvK', '2026-05-26');
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain("event_type='KvK'");
    expect(url).toContain("event_start_date~'2026-05-26");
    expect(url).toContain('perPage=500');
  });

  test('sorts results by rank', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getRecords('GAR', '2026-06-09');
    expect(fetchMock.mock.calls[0][0]).toContain('sort=rank');
  });

  test('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Forbidden' }, 403));
    await expect(getRecords('GAR', '2026-06-09')).rejects.toThrow('403');
  });

  test('fetches every page and concatenates items when totalPages > 1', async () => {
    const page1Items = [{ id: '1', player_name: 'Alice', score: 100 }];
    const page2Items = [{ id: '2', player_name: 'Bob', score: 200 }];
    const fetchMock = mockFetchSequence([
      { data: { items: page1Items, page: 1, perPage: 1, totalItems: 2, totalPages: 2 } },
      { data: { items: page2Items, page: 2, perPage: 1, totalItems: 2, totalPages: 2 } },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    const result = await getRecords('GAR', '2026-06-09');

    expect(result).toEqual([...page1Items, ...page2Items]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(decodeURIComponent(fetchMock.mock.calls[0][0])).toContain('page=1');
    expect(decodeURIComponent(fetchMock.mock.calls[1][0])).toContain('page=2');
  });

  test('stops after a single page when totalPages is 1', async () => {
    const fetchMock = mockFetch({ items: [{ id: '1' }], page: 1, perPage: 500, totalItems: 1, totalPages: 1 });
    vi.stubGlobal('fetch', fetchMock);

    await getRecords('GAR', '2026-06-09');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('getRosterMembers', () => {
  const ITEM_A = {
    id: 'abc1',
    player_name: 'Alice', rank: 'R4', level: 85, castle_level: 25,
    influence: 4200000, main_queue_influence: 1100000,
    main_queue_faction: 'League',
    last_online: '2026-06-17 10:00:00.000Z',
    updated: '2026-06-17 10:00:00.000Z',
  };
  const ITEM_B = {
    id: 'abc2',
    player_name: 'Bob', rank: 'R3', level: 78, castle_level: 22,
    influence: 3100000, main_queue_influence: 820000,
    main_queue_faction: 'Horde',
    last_online: '2026-06-16 08:00:00.000Z',
    updated: '2026-06-15 08:00:00.000Z',
  };

  test('returns members array from PocketBase response', async () => {
    vi.stubGlobal('fetch', mockFetch({ items: [ITEM_A, ITEM_B] }));
    const { members } = await getRosterMembers();
    expect(members).toEqual([ITEM_A, ITEM_B]);
  });

  test('derives lastUpdated as the most recent updated value', async () => {
    vi.stubGlobal('fetch', mockFetch({ items: [ITEM_A, ITEM_B] }));
    const { lastUpdated } = await getRosterMembers();
    expect(lastUpdated).toBe('2026-06-17 10:00:00.000Z');
  });

  test('requests correct fields, sort, perPage, and joined=true filter', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getRosterMembers();
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('sort=-influence');
    expect(url).toContain('perPage=500');
    expect(url).toContain('player_name');
    expect(url).toContain('castle_level');
    expect(url).toContain('main_queue_faction');
    expect(url).toContain('updated');
    expect(url).toContain('joined=true');
  });

  test('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Forbidden' }, 403));
    await expect(getRosterMembers()).rejects.toThrow('403');
  });
});

describe('getOtherPlayers', () => {
  const PAST_ITEM = {
    id: 'past1',
    player_name: 'Charlie', rank: 'R3', level: 70, castle_level: 18,
    influence: 2500000, main_queue_influence: 600000,
    main_queue_faction: 'Nature',
    last_online: '2026-06-10 08:00:00.000Z',
    updated: '2026-06-10 08:00:00.000Z',
    guild_tag: 'RVL',
  };

  test('returns members array from PocketBase response', async () => {
    vi.stubGlobal('fetch', mockFetch({ items: [PAST_ITEM] }));
    const { members } = await getOtherPlayers();
    expect(members).toEqual([PAST_ITEM]);
  });

  test('requests joined=false filter', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getOtherPlayers();
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('joined=false');
    expect(url).toContain('sort=-influence');
    expect(url).toContain('perPage=500');
  });

  test('requests guild_tag field', async () => {
    const fetchMock = mockFetch({ items: [] });
    vi.stubGlobal('fetch', fetchMock);
    await getOtherPlayers();
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('guild_tag');
  });

  test('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Forbidden' }, 403));
    await expect(getOtherPlayers()).rejects.toThrow('403');
  });
});
