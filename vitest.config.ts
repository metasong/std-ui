import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { esbuildTs } from './scripts/esbuild-ts.ts';

export default defineConfig({
	oxc: false,
	plugins: [esbuildTs()],
	resolve: {
		alias: { '@std-ui/core': fileURLToPath(new URL('./core/src/index.ts', import.meta.url)) },
	},
	test: {
		environment: 'jsdom',
		include: ['core/**/*.test.ts', 'ext/**/*.test.ts'],
	},
});