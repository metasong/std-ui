import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: { 'std-ui': fileURLToPath(new URL('./std-ui/src/index.ts', import.meta.url)) },
	},
	test: {
		environment: 'jsdom',
		include: ['std-ui/**/*.test.ts', 'std-ui-ext/**/*.test.ts'],
	},
});