<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getEventWeeks, getRecords } from '$lib/pb.js';
	import { filterByDay } from '$lib/utils.js';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';

	let eventType = $state('GAR');
	let weeks = $state([]);
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

	async function loadWeeks(preferredWeek) {
		try {
			weeks = await getEventWeeks(eventType);
			selectedWeek = weeks.includes(preferredWeek) ? preferredWeek : (weeks[0] ?? '');
		} catch (e) {
			error = e.message;
			weeks = [];
			selectedWeek = '';
		}
		await loadRecords();
	}

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		eventType = params.get('event') ?? 'GAR';
		selectedDay = params.get('day') ?? 'All';
		const preferredWeek = params.get('week') ?? '';
		await loadWeeks(preferredWeek);
	});

	async function onEventTypeChange(val) {
		eventType = val;
		selectedDay = 'All';
		await loadWeeks('');
	}

	async function onWeekChange(val) {
		selectedWeek = val;
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
	{eventType}
	{weeks}
	{selectedWeek}
	{selectedDay}
	{onEventTypeChange}
	{onWeekChange}
	{onDayChange}
/>
<Leaderboard records={filtered} {loading} {error} />
