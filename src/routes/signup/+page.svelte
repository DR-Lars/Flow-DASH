<script>
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let name = '';
	let loading = false;
	let error = '';
	let success = false;

	async function handleSignUp(e) {
		e.preventDefault();
		error = '';

		// Validation
		if (!email || !password || !name || !confirmPassword) {
			error = 'All fields are required';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;

		const { data, error: signUpError } = await authClient.signUp.email(
			{
				email,
				password,
				name,
				callbackURL: '/dashboard'
			},
			{
				onRequest: () => {
					loading = true;
				},
				onSuccess: () => {
					success = true;
					loading = false;
					setTimeout(() => {
						goto('/dashboard');
					}, 1500);
				},
				onError: (ctx) => {
					error = ctx.error.message;
					loading = false;
				}
			}
		);
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4"
>
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-800">Create Account</h1>

		{#if success}
			<div class="rounded border-l-4 border-green-500 bg-green-50 p-4 text-green-700">
				✓ Account created successfully! Redirecting...
			</div>
		{:else}
			<form on:submit={handleSignUp} class="space-y-5">
				{#if error}
					<div class="rounded border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
						{error}
					</div>
				{/if}

				<div>
					<label for="name" class="mb-2 block text-sm font-medium text-gray-700"> Full Name </label>
					<input
						type="text"
						id="name"
						bind:value={name}
						placeholder="Enter your full name"
						disabled={loading}
						required
						class="w-full rounded-lg border border-gray-300 px-4 py-2 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
					/>
				</div>

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
						placeholder="Min 8 characters"
						disabled={loading}
						required
						class="w-full rounded-lg border border-gray-300 px-4 py-2 transition focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
					/>
				</div>

				<div>
					<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">
						Confirm Password
					</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						placeholder="Confirm your password"
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
					{loading ? 'Creating Account...' : 'Sign Up'}
				</button>
			</form>

			<p class="mt-6 text-center text-sm text-gray-600">
				Already have an account?
				<a href="/login" class="font-semibold text-blue-600 hover:underline"> Sign In </a>
			</p>
		{/if}
	</div>
</div>
