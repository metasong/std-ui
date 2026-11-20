import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { esbuildTs } from './scripts/esbuild-ts.ts';

export default defineConfig({
	oxc: false,
	plugins: [esbuildTs()],
	resolve: {
		alias: { '@std-ui/core': fileURLToPath(new URL('./src/core/src/index.ts', import.meta.url)) },
	},
	test: {
		environment: 'jsdom',
		include: ['src/core/**/*.test.ts', 'src/ext/**/*.test.ts', 'src/router/**/*.test.ts'],
	},
});