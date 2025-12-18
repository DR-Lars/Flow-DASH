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
			const response = await fetch('/api/data');
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
	<h1 class="text-3xl font-bold mb-6">Flow DASH - Latest Report</h1>

	{#if loading}
		<p class="text-gray-500">Loading...</p>
	{:else if error}
		<p class="text-red-600">{error}</p>
	{:else if latestReport}
		<div class="bg-white rounded-lg shadow p-6">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-gray-600 text-sm">Timestamp</p>
					<p class="text-lg font-semibold">{new Date(latestReport.timestamp).toLocaleString()}</p>
				</div>
				<div>
					<p class="text-gray-600 text-sm">Temperature (°C)</p>
					<p class="text-lg font-semibold">{latestReport.temperature}</p>
				</div>
				<div>
					<p class="text-gray-600 text-sm">Pressure (bar)</p>
					<p class="text-lg font-semibold">{latestReport.pressure}</p>
				</div>
				<div>
					<p class="text-gray-600 text-sm">Mass Flow</p>
					<p class="text-lg font-semibold">{latestReport.mass_flow}</p>
				</div>
				<div>
					<p class="text-gray-600 text-sm">Air Index</p>
					<p class="text-lg font-semibold">{latestReport.air_index}</p>
				</div>
				<div>
					<p class="text-gray-600 text-sm">Total Quantity</p>
					<p class="text-lg font-semibold">{latestReport.total_quantity}</p>
				</div>
				<div>
					<p class="text-gray-600 text-sm">Standard Density</p>
					<p class="text-lg font-semibold">{latestReport.standard_density}</p>
				</div>
				<div>
					<p class="text-gray-600 text-sm">Raw Density</p>
					<p class="text-lg font-semibold">{latestReport.raw_density}</p>
				</div>
			</div>
		</div>
	{/if}
</div>
