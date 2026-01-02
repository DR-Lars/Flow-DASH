import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import 'dotenv/config';

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-build-only',
	url: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
	emailAndPassword: {
		enabled: true
	},
	database: new Pool({
		connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/placeholder'
	}),
	plugins: [sveltekitCookies(getRequestEvent)]
});
