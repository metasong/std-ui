// Perf profiles, kept out of the normal suite. Run: npx vitest run --config vitest.perf.config.ts
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
		include: ['src/**/*.perf.ts'],
		testTimeout: 300_000,
		// One file at a time, so timings are not skewed by other workers.
		fileParallelism: false,
	},
});
