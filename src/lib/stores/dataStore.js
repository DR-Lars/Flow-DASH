import { writable } from 'svelte/store';

// Temporary in-memory store for pushed data
export const pushedData = writable([]);
