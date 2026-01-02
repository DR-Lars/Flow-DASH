import { createAuthClient } from 'better-auth/svelte';
import 'dotenv/config';

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL
});
