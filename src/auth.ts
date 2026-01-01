import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { DATABASE_URL } from '$env/static/private';

export const auth = betterAuth({
	emailAndPassword: {
		enabled: true
	},
	database: new Pool({
		connectionString: DATABASE_URL
	}),
	plugins: [sveltekitCookies(getRequestEvent)]
});
