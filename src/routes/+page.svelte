<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getEventOptions, getRecords } from '$lib/pb.js';
	import { filterByDay } from '$lib/utils.js';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';

	let eventType = $state('GAR');
	let eventOptions = $state([]);
	let selectedWeek = $state('');
	let selectedDay = $state('All');
	let allRecords = $state([]);
	let loading = $state(false);
	let error = $state(null);

	const filtered = $derived(filterByDay(allRecords, selectedDay));

	function updateUrl() {
		const params = new URLSearchParams({ event: eventType, week: selectedWeek, day: selectedDay });
		goto('?' + params.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function loadRecords() {
		if (!selectedWeek) return;
		loading = true;
		error = null;
		try {
			allRecords = await getRecords(eventType, selectedWeek);
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
		await loadRecords();
	}

	function onDayChange(val) {
		selectedDay = val;
		updateUrl();
	}
</script>

<h1>Top Heroes Stats</h1>
<FilterBar
	{eventOptions}
	{eventType}
	{selectedWeek}
	{selectedDay}
	{onSelectionChange}
	{onDayChange}
/>
<Leaderboard records={filtered} {loading} {error} />
