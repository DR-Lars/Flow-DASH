import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env as publicEnv } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET || 'fallback-secret-for-build-only',
	url: publicEnv.PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
	emailAndPassword: {
		enabled: true
	},
	database: new Pool({
		connectionString: env.DATABASE_URL || 'postgresql://localhost:5432/placeholder'
	}),
	plugins: [sveltekitCookies(getRequestEvent)]
});
