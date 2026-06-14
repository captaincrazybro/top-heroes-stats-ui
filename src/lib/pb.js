import { PUBLIC_PB_URL } from '$env/static/public';

const COLLECTION = 'topHeroesEventRecords';

async function pbFetch(path) {
  const res = await fetch(`${PUBLIC_PB_URL}/api${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PocketBase ${path} → ${res.status}: ${body}`);
  }
  const data = await res.json();
  if (data.totalPages > 1) {
    console.warn(`[pb] ${path} has ${data.totalPages} pages; only page 1 returned`);
  }
  return data;
}

export async function getEventOptions() {
  const params = new URLSearchParams({
    fields: 'event_type,event_start_date',
    sort: '-event_start_date',
    perPage: '500',
  });
  const data = await pbFetch(`/collections/${COLLECTION}/records?${params}`);
  const seen = new Set();
  return data.items
    .map(r => ({ eventType: r.event_type, week: r.event_start_date.split(' ')[0] }))
    .filter(({ eventType, week }) => {
      const key = `${eventType}|${week}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function getRecords(eventType, eventStartDate) {
  const params = new URLSearchParams({
    filter: `event_type='${eventType}'&&event_start_date~'${eventStartDate}'`,
    sort: 'rank',
    perPage: '500',
  });
  const data = await pbFetch(`/collections/${COLLECTION}/records?${params}`);
  return data.items;
}
