import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import 'dotenv/config';

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	url: process.env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true
	},
	database: new Pool({
		connectionString: process.env.DATABASE_URL
	}),
	plugins: [sveltekitCookies(getRequestEvent)]
});
