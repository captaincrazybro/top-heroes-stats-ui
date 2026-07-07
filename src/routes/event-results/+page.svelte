<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getEventOptions, getRecords, getOtherGuildRecords, getRosterMembers } from '$lib/pb.js';
	import { filterByDay, matchRosterToEvent } from '$lib/utils.js';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';

	let eventType = $state('GAR');
	let eventOptions = $state([]);
	let selectedWeek = $state('');
	let selectedDay = $state('All');
	let useGuildRank = $state(false);
	let crossRef = $state(false);
	let showOtherGuilds = $state(false);
	let allRecords = $state([]);
	let loading = $state(false);
	let error = $state(null);
	let rosterMembers = $state([]);
	let rosterLoading = $state(false);

	const filtered = $derived(filterByDay(allRecords, selectedDay));

	const displayRecords = $derived.by(() => {
		if (!crossRef || rosterMembers.length === 0) return filtered;
		const matches = matchRosterToEvent(rosterMembers, filtered);
		const combined = [...filtered];
		let extra = filtered.reduce((max, r) => Math.max(max, r.rank ?? 0), 0);
		for (const { member, eventRecord } of matches) {
			if (!eventRecord) {
				combined.push({
					id: `roster-${member.id}`,
					player_name: member.player_name,
					score: 0,
					rank: ++extra,
					notInEvent: true,
				});
			}
		}
		return combined;
	});

	$effect(() => {
		if (crossRef && rosterMembers.length === 0 && !rosterLoading) {
			rosterLoading = true;
			getRosterMembers()
				.then(({ members }) => { rosterMembers = members; })
				.catch(() => {})
				.finally(() => { rosterLoading = false; });
		}
	});

	function updateUrl() {
		const params = new URLSearchParams({ event: eventType, week: selectedWeek, day: selectedDay });
		goto('?' + params.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function loadRecords() {
		if (!selectedWeek) return;
		loading = true;
		error = null;
		try {
			const hgs = await getRecords(eventType, selectedWeek);
			if (showOtherGuilds) {
				const others = await getOtherGuildRecords(eventType, selectedWeek);
				allRecords = [...hgs, ...others];
			} else {
				allRecords = hgs;
			}
		} catch (e) {
			error = e.message;
			allRecords = [];
		} finally {
			loading = false;
		}
		updateUrl();
	}

	async function loadOptions(preferredEvent, preferredWeek) {
		try {
			eventOptions = await getEventOptions();
			const match = eventOptions.find(o => o.eventType === preferredEvent && o.week === preferredWeek);
			const selected = match ?? eventOptions[0] ?? { eventType: 'GAR', week: '' };
			eventType = selected.eventType;
			selectedWeek = selected.week;
		} catch (e) {
			error = e.message;
			eventOptions = [];
			eventType = 'GAR';
			selectedWeek = '';
		}
		await loadRecords();
	}

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);

		const DAYS = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const rawDay = params.get('day');
		selectedDay = DAYS.includes(rawDay) ? rawDay : 'All';

		await loadOptions(params.get('event') ?? '', params.get('week') ?? '');
	});

	async function onSelectionChange(type, week) {
		eventType = type;
		selectedWeek = week;
		selectedDay = 'All';
		useGuildRank = false;
		await loadRecords();
	}

	function onDayChange(val) {
		selectedDay = val;
		updateUrl();
	}

	function onGuildRankChange(val) {
		useGuildRank = val;
	}

	function onCrossRefChange(val) {
		crossRef = val;
	}

	async function onOtherGuildsChange(val) {
		showOtherGuilds = val;
		await loadRecords();
	}
</script>

<FilterBar
	{eventOptions}
	{eventType}
	{selectedWeek}
	{selectedDay}
	{useGuildRank}
	{crossRef}
	{showOtherGuilds}
	{onSelectionChange}
	{onDayChange}
	{onGuildRankChange}
	{onCrossRefChange}
	{onOtherGuildsChange}
/>
<Leaderboard
	records={displayRecords}
	loading={loading || (crossRef && rosterLoading)}
	{error}
	{useGuildRank}
	showGuild={showOtherGuilds}
/>
