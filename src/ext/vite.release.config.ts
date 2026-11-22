import { defineConfig } from 'vite';
import { esbuildTs } from '../../scripts/esbuild-ts.ts';
import { resolve } from 'node:path';

// Release bundles: same as `vite.bundle.config.ts`, but any local `dev/flag.ts` `DEV` is the constant
// `false`. `ext` has no dev-only code yet (and `@std-ui/core` stays external, so its own release/dev
// choice is made by whichever core build is loaded), so today this only renames the output; it keeps
// the release set symmetrical with core and is ready for future dev-only diagnostics.
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
			name: 'StdUIExt',
			formats: ['es', 'iife'],
			fileName: (format) => (format === 'es' ? 'std-ui-ext.release.min.js' : 'std-ui-ext.release.iife.min.js'),
		},
		rollupOptions: {
			external: ['@std-ui/core'],
			output: { globals: { '@std-ui/core': 'StdUI' } },
		},
	},
});
