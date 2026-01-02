import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { BETTER_AUTH_SECRET, DATABASE_URL } from '$env/static/private';

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	url: getURL(),
	emailAndPassword: {
		enabled: true
	},
	database: new Pool({
		connectionString: DATABASE_URL
	}),
	plugins: [sveltekitCookies(getRequestEvent)]
});

function getURL() {
	const event = getRequestEvent();
	if (event) {
		return event.url.origin;
	}
	// Fallback for non-request contexts
	return process.env.PUBLIC_BETTER_AUTH_URL || 'http://localhost:5173';
}
