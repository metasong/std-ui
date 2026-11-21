import { defineConfig } from 'vite';
import { esbuildTs } from '../../scripts/esbuild-ts.ts';
import { resolve } from 'node:path';

// `@std-ui/core` is a peer: kept external (import map for ESM, `StdUI` global for IIFE).
export default defineConfig({
	plugins: [esbuildTs()],
	build: {
		outDir: 'dist/browser',
		emptyOutDir: true,
		minify: 'oxc',
		sourcemap: true,
		lib: {
			entry: resolve(import.meta.dirname, 'src/index.ts'),
			name: 'StdUIExt',
			formats: ['es', 'iife'],
			fileName: (format) => (format === 'es' ? 'std-ui-ext.min.js' : 'std-ui-ext.iife.min.js'),
		},
		rollupOptions: {
			external: ['@std-ui/core'],
			output: { globals: { '@std-ui/core': 'StdUI' } },
		},
	},
});
