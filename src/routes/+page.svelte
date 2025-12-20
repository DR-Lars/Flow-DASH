<script lang="ts">
	import { onMount } from 'svelte';

	type Report = {
		id?: number;
		meter: string | number;
		ship: string;
		timestamp: string;
		temperature: number | null;
		pressure: number | null;
		mass_flow: number | null;
		air_index: number | null;
		total_quantity: number | null;
		standard_density: number | null;
		raw_density: number | null;
	};

	let data: Report[] = [];
	let loading = false;
	let error: string | null = null;

	// Filters
	let meter_id: string = '';
	let ship_name: string = '';
	let fromTs: string = '';
	let toTs: string = '';

	// Menu options (derived from data)
	let meters: string[] = [];
	let ships: string[] = [];

	function buildUrl() {
		const params = new URLSearchParams();
		if (meter_id) params.set('meter_id', meter_id);
		if (ship_name) params.set('ship_name', ship_name);
		if (fromTs) params.set('from', fromTs);
		if (toTs) params.set('to', toTs);
		return `/api/report/batch?${params.toString()}`;
	}

	async function loadData() {
		loading = true;
		error = null;
		try {
			const res = await fetch(buildUrl());
			const json = await res.json();
			if (!json.success) {
				throw new Error(json.error || 'Failed to fetch data');
			}
			data = json.data as Report[];
			// Populate menu options from current dataset
			meters = Array.from(new Set(data.map((r) => String(r.meter)))).filter(Boolean).sort();
			ships = Array.from(new Set(data.map((r) => String(r.ship)))).filter(Boolean).sort();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function resetFilters() {
		meter_id = '';
		ship_name = '';
		fromTs = '';
		toTs = '';
		loadData();
	}

	onMount(loadData);
</script>

<div class="p-4 space-y-4">
	<h1 class="text-2xl font-semibold">Welcome to Flow DASH</h1>

	<!-- Filters -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div>
			<label class="block text-sm mb-1">Meter</label>
			<select bind:value={meter_id} class="border rounded w-full p-2" on:change={loadData}>
				<option value="">All meters</option>
				{#each meters as m}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="block text-sm mb-1">Ship</label>
			<select bind:value={ship_name} class="border rounded w-full p-2" on:change={loadData}>
				<option value="">All ships</option>
				{#each ships as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="block text-sm mb-1">From</label>
			<input type="datetime-local" bind:value={fromTs} class="border rounded w-full p-2" on:change={loadData} />
		</div>
		<div>
			<label class="block text-sm mb-1">To</label>
			<input type="datetime-local" bind:value={toTs} class="border rounded w-full p-2" on:change={loadData} />
		</div>
	</div>

	<div class="flex items-center gap-2">
		<button class="px-3 py-2 bg-blue-600 text-white rounded" on:click={loadData}>Apply</button>
		<button class="px-3 py-2 bg-gray-200 rounded" on:click={resetFilters}>Reset</button>
		{#if loading}
			<span class="text-gray-600">Loading…</span>
		{/if}
		{#if error}
			<span class="text-red-600">{error}</span>
		{/if}
	</div>

	<!-- Data Table -->
	<div class="overflow-auto">
		<table class="min-w-full text-sm">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-3 py-2 text-left">Meter</th>
					<th class="px-3 py-2 text-left">Ship</th>
					<th class="px-3 py-2 text-left">Timestamp</th>
					<th class="px-3 py-2 text-left">Temperature</th>
					<th class="px-3 py-2 text-left">Pressure</th>
					<th class="px-3 py-2 text-left">Mass Flow</th>
					<th class="px-3 py-2 text-left">Air Index</th>
					<th class="px-3 py-2 text-left">Total Quantity</th>
					<th class="px-3 py-2 text-left">Standard Density</th>
					<th class="px-3 py-2 text-left">Raw Density</th>
				</tr>
			</thead>
			<tbody>
				{#each data as row}
					<tr class="border-t">
						<td class="px-3 py-2">{row.meter}</td>
						<td class="px-3 py-2">{row.ship}</td>
						<td class="px-3 py-2">{new Date(row.timestamp).toLocaleString()}</td>
						<td class="px-3 py-2">{row.temperature ?? ''}</td>
						<td class="px-3 py-2">{row.pressure ?? ''}</td>
						<td class="px-3 py-2">{row.mass_flow ?? ''}</td>
						<td class="px-3 py-2">{row.air_index ?? ''}</td>
						<td class="px-3 py-2">{row.total_quantity ?? ''}</td>
						<td class="px-3 py-2">{row.standard_density ?? ''}</td>
						<td class="px-3 py-2">{row.raw_density ?? ''}</td>
					</tr>
				{/each}
				{#if data.length === 0 && !loading}
					<tr>
						<td class="px-3 py-4 text-gray-500" colspan="10">No data</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>