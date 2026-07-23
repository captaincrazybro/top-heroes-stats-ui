import { PUBLIC_PB_URL } from '$env/static/public';

const COLLECTION = 'topHeroesEventRecords';
export const DEFAULT_GUILD = 'HGS';

async function pbFetchPage(path) {
  const res = await fetch(`${PUBLIC_PB_URL}/api${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PocketBase ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

// PocketBase caps perPage server-side, so a single request can silently
// truncate results. Follow `page` until totalPages is exhausted.
async function pbFetch(collectionPath, params) {
  const items = [];
  let page = 1;
  while (true) {
    params.set('page', String(page));
    const data = await pbFetchPage(`${collectionPath}?${params}`);
    items.push(...data.items);
    if (!data.totalPages || page >= data.totalPages) return items;
    page++;
  }
}

export async function getEventOptions() {
  const params = new URLSearchParams({
    fields: 'event_type,event_start_date',
    sort: '-event_start_date',
    perPage: '500',
  });
  const items = await pbFetch(`/collections/${COLLECTION}/records`, params);
  const seen = new Set();
  return items
    .map(r => ({ eventType: r.event_type, week: r.event_start_date.split(' ')[0] }))
    .filter(({ eventType, week }) => {
      const key = `${eventType}|${week}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function getRecords(eventType, eventStartDate, guild = DEFAULT_GUILD) {
  const params = new URLSearchParams({
    filter: `event_type='${eventType}'&&event_start_date~'${eventStartDate}'&&guild_tag='${guild}'`,
    sort: 'rank',
    perPage: '500',
  });
  return pbFetch(`/collections/${COLLECTION}/records`, params);
}

export async function getOtherGuildRecords(eventType, eventStartDate, excludeGuild = DEFAULT_GUILD) {
  const params = new URLSearchParams({
    filter: `event_type='${eventType}'&&event_start_date~'${eventStartDate}'&&guild_tag!='${excludeGuild}'`,
    sort: 'rank',
    perPage: '500',
  });
  return pbFetch(`/collections/${COLLECTION}/records`, params);
}

const MEMBERS_COLLECTION = 'topHeroesGuildRoster';
const MEMBERS_FIELDS = 'id,player_name,rank,level,castle_level,influence,main_queue_influence,main_queue_faction,last_online,updated,recent_ranked_match_ranking,timezone,language,guild_member_buffs,has_aoe_buffs,chat_activity,guild_tag';

export async function getRosterMembers() {
  const params = new URLSearchParams({
    fields: MEMBERS_FIELDS,
    filter: 'joined=true',
    sort: '-influence',
    perPage: '500',
  });
  const members = await pbFetch(`/collections/${MEMBERS_COLLECTION}/records`, params);
  const lastUpdated = members.reduce(
    (max, r) => (r.updated > max ? r.updated : max),
    ''
  );
  return { members, lastUpdated };
}

const LAYOUTS_COLLECTION = 'topHeroesCastleLayouts';

export async function getCastleLayouts() {
  const params = new URLSearchParams({
    sort: '-created',
    perPage: '500',
  });
  return pbFetch(`/collections/${LAYOUTS_COLLECTION}/records`, params);
}

export function getLayoutImageUrl(record) {
  if (!record?.image) return null;
  return `${PUBLIC_PB_URL}/api/files/${LAYOUTS_COLLECTION}/${record.id}/${record.image}`;
}

export async function getOtherPlayers() {
  const params = new URLSearchParams({
    fields: MEMBERS_FIELDS,
    filter: 'joined=false',
    sort: '-influence',
    perPage: '500',
  });
  const members = await pbFetch(`/collections/${MEMBERS_COLLECTION}/records`, params);
  return { members };
}

export async function getAllGuildMembers() {
  const params = new URLSearchParams({
    fields: `${MEMBERS_FIELDS},joined,server`,
    sort: '-influence',
    perPage: '500',
  });
  return pbFetch(`/collections/${MEMBERS_COLLECTION}/records`, params);
}
