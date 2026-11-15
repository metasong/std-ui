import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { esbuildTs } from './scripts/esbuild-ts.ts';

export default defineConfig({
	oxc: false,
	plugins: [esbuildTs()],
	resolve: {
		alias: { 'std-ui': fileURLToPath(new URL('./std-ui/src/index.ts', import.meta.url)) },
	},
	test: {
		environment: 'jsdom',
		include: ['std-ui/**/*.test.ts', 'std-ui-ext/**/*.test.ts'],
	},
});