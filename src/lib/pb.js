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

export async function getEventWeeks(eventType) {
  const params = new URLSearchParams({
    filter: `event_type='${eventType}'`,
    fields: 'event_start_date',
    sort: '-event_start_date',
    perPage: '500',
  });
  const data = await pbFetch(`/collections/${COLLECTION}/records?${params}`);
  const seen = new Set();
  return data.items
    .map(r => r.event_start_date.split(' ')[0])
    .filter(d => {
      if (seen.has(d)) return false;
      seen.add(d);
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
