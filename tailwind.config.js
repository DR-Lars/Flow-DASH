import { join } from 'path';

export default {
	content: [join(__dirname, 'src/**/*.{svelte,html,js,ts}')],
	theme: {
		extend: {}
	},
	plugins: []
};
