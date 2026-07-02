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

const MEMBERS_COLLECTION = 'topHeroesGuildRoster';
const MEMBERS_FIELDS = 'id,player_name,rank,level,castle_level,influence,main_queue_influence,main_queue_faction,last_online,updated,recent_ranked_match_ranking,timezone,language,guild_member_buffs,has_aoe_buffs,chat_activity';

export async function getRosterMembers() {
  const params = new URLSearchParams({
    fields: MEMBERS_FIELDS,
    filter: 'joined=true',
    sort: '-influence',
    perPage: '500',
  });
  const data = await pbFetch(`/collections/${MEMBERS_COLLECTION}/records?${params}`);
  const lastUpdated = data.items.reduce(
    (max, r) => (r.updated > max ? r.updated : max),
    ''
  );
  return { members: data.items, lastUpdated };
}

const LAYOUTS_COLLECTION = 'topHeroesCastleLayouts';

export async function getCastleLayouts() {
  const params = new URLSearchParams({
    sort: '-created',
    perPage: '500',
  });
  const data = await pbFetch(`/collections/${LAYOUTS_COLLECTION}/records?${params}`);
  return data.items;
}

export function getLayoutImageUrl(record) {
  if (!record?.image) return null;
  return `${PUBLIC_PB_URL}/api/files/${LAYOUTS_COLLECTION}/${record.id}/${record.image}`;
}

export async function getPastMembers() {
  const params = new URLSearchParams({
    fields: MEMBERS_FIELDS,
    filter: 'joined=false',
    sort: '-influence',
    perPage: '500',
  });
  const data = await pbFetch(`/collections/${MEMBERS_COLLECTION}/records?${params}`);
  return { members: data.items };
}
