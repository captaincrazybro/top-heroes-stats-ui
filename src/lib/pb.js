import { PUBLIC_PB_URL } from '$env/static/public';

const COLLECTION = 'topHeroesEventRecords';

async function pbFetch(path) {
  const res = await fetch(`${PUBLIC_PB_URL}/api${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PocketBase ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

export async function getEventWeeks(eventType) {
  const filter = `event_type='${eventType}'`;
  const data = await pbFetch(
    `/collections/${COLLECTION}/records?filter=${filter}&fields=event_start_date&sort=-event_start_date&perPage=500`
  );
  const seen = new Set();
  return data.items
    .map(r => r.event_start_date)
    .filter(d => {
      if (seen.has(d)) return false;
      seen.add(d);
      return true;
    });
}

export async function getRecords(eventType, eventStartDate) {
  const filter = `event_type='${eventType}'&&event_start_date='${eventStartDate}'`;
  const data = await pbFetch(
    `/collections/${COLLECTION}/records?filter=${filter}&sort=rank&perPage=500`
  );
  return data.items;
}
