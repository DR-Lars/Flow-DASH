<script>
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleSignIn(e) {
		e.preventDefault();
		error = '';

		if (!email || !password) {
			error = 'Email and password are required';
			return;
		}

		loading = true;

		try {
			const response = await authClient.signIn.email({
				email: email.trim(),
				password,
				callbackURL: '/dashboard'
			});

			if (response.error) {
				error = response.error.message || 'Invalid credentials';
				loading = false;
				return;
			}

			goto('/dashboard');
		} catch (err) {
			error = err?.message || 'An error occurred during sign in';
			loading = false;
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4"
>
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-800">Sign In</h1>

		<form on:submit={handleSignIn} class="space-y-5">
			{#if error}
				<div class="rounded border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			{/if}

			<div>
				<label for="email" class="mb-2 block text-sm font-medium text-gray-700"> Email </label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="Enter your email"
					disabled={loading}
					required
					class="w-full rounded-lg border border-gray-300 px-4 py-2 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</div>

			<div>
				<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
					Password
				</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="Enter your password"
					disabled={loading}
					required
					class="w-full rounded-lg border border-gray-300 px-4 py-2 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="mt-6 w-full transform rounded-lg bg-gradient-to-r from-blue-600 to-purple-700 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
			>
				{loading ? 'Signing In...' : 'Sign In'}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-600">
			Don't have an account?
			<a href="/signup" class="font-semibold text-blue-600 hover:underline"> Sign Up </a>
		</p>
	</div>
</div>

<p class="mt-6 text-center text-sm text-gray-600">
	Don't have an account?
	<a href="/signup" class="font-semibold text-blue-600 hover:underline"> Sign Up </a>
</p>
