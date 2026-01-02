<script lang="ts">
	import Chart from 'chart.js/auto';
	import type { Chart as ChartType } from 'chart.js/auto';
	import { onMount } from 'svelte';

	type Report = {
		id?: number;
		meter: string | number;
		ship: string;
		batch_number: string | number;
		timestamp: string;
		temperature: number | null;
		pressure: number | null;
		mass_flow: number | null;
		air_index: number | null;
		total_quantity: number | null;
		standard_density: number | null;
		raw_density: number | null;
	};

	let loading = true;
	let error: string | null = null;
	let chart: ChartType | null = null;
	let allData: Report[] = [];

	// Filters (same as dashboard)
	let meter_id: string = '';
	let ship_name: string = '';
	let batch_number: string = '';
	let fromTs: string = '';
	let toTs: string = '';

	// Menu options (derived from data)
	let meters: string[] = [];
	let ships: string[] = [];
	let batches: string[] = [];

	// Selection states
	let selectedMetrics = {
		temperature: true,
		pressure: true,
		mass_flow: true,
		air_index: false,
		total_quantity: false
	};

	function buildUrl() {
		const params = new URLSearchParams();
		if (meter_id) params.set('meter_id', meter_id);
		if (ship_name) params.set('ship_name', ship_name);
		if (batch_number) params.set('batch_number', batch_number);
		if (fromTs) params.set('from', fromTs);
		if (toTs) params.set('to', toTs);
		return `/api/report/batch?${params.toString()}`;
	}

	function updateChart() {
		if (!chart || allData.length === 0) return;

		// Sort data by timestamp
		const sortedData = [...allData].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		);

		// Create labels from timestamps
		const labels = sortedData.map((row) => new Date(row.timestamp).toLocaleString());

		const datasets = [];

		if (selectedMetrics.temperature) {
			datasets.push({
				label: 'Temperature',
				data: sortedData.map((row) => row.temperature),
				borderColor: '#ef4444',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				tension: 0.3,
				pointRadius: 2
			});
		}

		if (selectedMetrics.pressure) {
			datasets.push({
				label: 'Pressure',
				data: sortedData.map((row) => row.pressure),
				borderColor: '#3b82f6',
				backgroundColor: 'rgba(59, 130, 246, 0.1)',
				tension: 0.3,
				pointRadius: 2
			});
		}

		if (selectedMetrics.mass_flow) {
			datasets.push({
				label: 'Mass Flow',
				data: sortedData.map((row) => row.mass_flow),
				borderColor: '#10b981',
				backgroundColor: 'rgba(16, 185, 129, 0.1)',
				tension: 0.3,
				pointRadius: 2
			});
		}

		if (selectedMetrics.air_index) {
			datasets.push({
				label: 'Air Index',
				data: sortedData.map((row) => row.air_index),
				borderColor: '#f59e0b',
				backgroundColor: 'rgba(245, 158, 11, 0.1)',
				tension: 0.3,
				pointRadius: 2
			});
		}

		if (selectedMetrics.total_quantity) {
			datasets.push({
				label: 'Total Quantity',
				data: sortedData.map((row) => row.total_quantity),
				borderColor: '#8b5cf6',
				backgroundColor: 'rgba(139, 92, 246, 0.1)',
				tension: 0.3,
				pointRadius: 2
			});
		}

		chart.data.labels = labels;
		chart.data.datasets = datasets;
		chart.update();
	}

	async function loadData() {
		loading = true;
		error = null;
		try {
			const res = await fetch(buildUrl(), {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer TEMP123!'
				}
			});
			const json = await res.json();
			if (!json.success) {
				throw new Error(json.error || 'Failed to fetch data');
			}

			allData = json.data as Report[];

			// Populate menu options from current dataset
			meters = Array.from(new Set(allData.map((r: Report) => String(r.meter))))
				.filter(Boolean)
				.sort();
			ships = Array.from(new Set(allData.map((r: Report) => String(r.ship))))
				.filter(Boolean)
				.sort();
			batches = Array.from(new Set(allData.map((r: Report) => String(r.batch_number))))
				.filter(Boolean)
				.sort();

			if (chart) {
				updateChart();
			}
			loading = false;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			loading = false;
		}
	}

	function resetFilters() {
		meter_id = '';
		ship_name = '';
		batch_number = '';
		fromTs = '';
		toTs = '';
		loadData();
	}

	onMount(async () => {
		// Initialize chart
		const canvas = document.getElementById('acquisitions');
		if (!canvas) return;

		chart = new Chart(canvas as HTMLCanvasElement, {
			type: 'line',
			data: {
				labels: [],
				datasets: []
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Report Data Trends'
					}
				},
				scales: {
					y: {
						beginAtZero: true
					}
				}
			}
		});

		// Load initial data
		await loadData();
	});
</script>

<div class="space-y-4 p-4">
	<h2 class="mb-4 text-xl font-bold">Chart Configuration</h2>

	<!-- Filters (same as dashboard) -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-5">
		<div>
			<label for="meter-select" class="mb-1 block text-sm">Meter</label>
			<select
				id="meter-select"
				bind:value={meter_id}
				class="w-full rounded border p-2"
				on:change={loadData}
			>
				<option value="">All meters</option>
				{#each meters as m}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="ship-select" class="mb-1 block text-sm">Ship</label>
			<select
				id="ship-select"
				bind:value={ship_name}
				class="w-full rounded border p-2"
				on:change={loadData}
			>
				<option value="">All ships</option>
				{#each ships as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="batch-select" class="mb-1 block text-sm">Batch</label>
			<select
				id="batch-select"
				bind:value={batch_number}
				class="w-full rounded border p-2"
				on:change={loadData}
			>
				<option value="">All batches</option>
				{#each batches as b}
					<option value={b}>{b}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="from-input" class="mb-1 block text-sm">From</label>
			<input
				id="from-input"
				type="datetime-local"
				bind:value={fromTs}
				class="w-full rounded border p-2"
				on:change={loadData}
			/>
		</div>
		<div>
			<label for="to-input" class="mb-1 block text-sm">To</label>
			<input
				id="to-input"
				type="datetime-local"
				bind:value={toTs}
				class="w-full rounded border p-2"
				on:change={loadData}
			/>
		</div>
	</div>

	<div class="flex items-center gap-2">
		<button class="rounded bg-blue-600 px-3 py-2 text-white" on:click={loadData}>Apply</button>
		<button class="rounded bg-gray-200 px-3 py-2" on:click={resetFilters}>Reset</button>
		{#if loading}
			<span class="text-gray-600">Loading…</span>
		{/if}
		{#if error}
			<span class="text-red-600">{error}</span>
		{/if}
	</div>

	<!-- Metrics Selection -->
	<div class="rounded border p-4">
		<h3 class="mb-3 text-sm font-semibold">Select Metrics</h3>
		<div class="flex flex-wrap gap-4">
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" bind:checked={selectedMetrics.temperature} on:change={updateChart} />
				<span style="color: #ef4444;">●</span> Temperature
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" bind:checked={selectedMetrics.pressure} on:change={updateChart} />
				<span style="color: #3b82f6;">●</span> Pressure
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" bind:checked={selectedMetrics.mass_flow} on:change={updateChart} />
				<span style="color: #10b981;">●</span> Mass Flow
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" bind:checked={selectedMetrics.air_index} on:change={updateChart} />
				<span style="color: #f59e0b;">●</span> Air Index
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					bind:checked={selectedMetrics.total_quantity}
					on:change={updateChart}
				/>
				<span style="color: #8b5cf6;">●</span> Total Quantity
			</label>
		</div>
	</div>

	<!-- Chart -->
	<div class="rounded border p-4">
		<canvas id="acquisitions"></canvas>
	</div>
</div>
