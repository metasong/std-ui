import { defineConfig } from 'vite';
import { esbuildTs } from '../../scripts/esbuild-ts.ts';
import { resolve } from 'node:path';

// Release bundles: same as `vite.bundle.config.ts`, but `DEV` is the constant `false`, so every
// dev-only diagnostic (src/dev/*: warnings, effect-cycle stack traces) is dead-code eliminated.
const releaseFlag = {
	name: 'std-ui-release-flag',
	enforce: 'pre' as const,
	load(id: string) {
		if (/[\\/]dev[\\/]flag\.ts$/.test(id.split('?')[0]!)) return 'export const DEV = false;';
		return null;
	},
};

export default defineConfig({
	plugins: [releaseFlag, esbuildTs()],
	build: {
		outDir: 'dist/browser',
		emptyOutDir: false, // shares dist/browser with the normal bundles (build:bundle runs first and cleans it)
		minify: 'oxc',
		sourcemap: true,
		lib: {
			entry: resolve(import.meta.dirname, 'src/index.ts'),
			name: 'StdUI',
			formats: ['es', 'iife'],
			fileName: (format) => (format === 'es' ? 'std-ui-core.release.min.js' : 'std-ui-core.release.iife.min.js'),
		},
	},
});
