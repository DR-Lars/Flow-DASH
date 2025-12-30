<script>
	import { onMount } from 'svelte';

	/**
	 * @type {{ timestamp: string | number | Date; temperature: any; pressure: any; mass_flow: any; air_index: any; total_quantity: any; standard_density: any; raw_density: any; } | null}
	 */
	let latestReport = null;
	let loading = true;
	/**
	 * @type {string | null}
	 */
	let error = null;

	onMount(async () => {
		try {
			const response = await fetch('/api/report', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer TEMP123!'
				}
			});
			const result = await response.json();
			if (result.success && result.data.length > 0) {
				latestReport = result.data[0]; // First item is the latest (DESC order)
			} else {
				error = 'No reports found';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to fetch report';
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold">Flow DASH - Latest Report</h1>

	{#if loading}
		<p class="text-gray-500">Loading...</p>
	{:else if error}
		<p class="text-red-600">{error}</p>
	{:else if latestReport}
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-gray-600">Timestamp</p>
					<p class="text-lg font-semibold">{new Date(latestReport.timestamp).toLocaleString()}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Temperature (°C)</p>
					<p class="text-lg font-semibold">{latestReport.temperature}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Pressure (bar)</p>
					<p class="text-lg font-semibold">{latestReport.pressure}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Mass Flow</p>
					<p class="text-lg font-semibold">{latestReport.mass_flow}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Air Index</p>
					<p class="text-lg font-semibold">{latestReport.air_index}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Total Quantity</p>
					<p class="text-lg font-semibold">{latestReport.total_quantity}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Standard Density</p>
					<p class="text-lg font-semibold">{latestReport.standard_density}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">Raw Density</p>
					<p class="text-lg font-semibold">{latestReport.raw_density}</p>
				</div>
			</div>
		</div>
	{/if}
</div>
