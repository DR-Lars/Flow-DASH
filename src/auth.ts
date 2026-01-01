import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { BETTER_AUTH_SECRET, DATABASE_URL, PUBLIC } from '$env/static/private';
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	url: PUBLIC_BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true
	},
	database: new Pool({
		connectionString: DATABASE_URL
	}),
	plugins: [sveltekitCookies(getRequestEvent)]
});
