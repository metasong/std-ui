import { defineConfig, transformWithEsbuild, type Plugin } from 'vite';
import { resolve } from 'node:path';

// Vite skips whitespace minification for `es` library output.
const minifyEs = (): Plugin => ({
	name: 'minify-es',
	renderChunk(code, chunk, options) {
		if (options.format !== 'es') return null;
		return transformWithEsbuild(code, chunk.fileName, { minify: true, sourcemap: true });
	},
});

// `std-ui` is a peer: kept external (import map for ESM, `StdUI` global for IIFE).
export default defineConfig({
	plugins: [minifyEs()],
	build: {
		outDir: 'dist/browser',
		emptyOutDir: true,
		minify: 'esbuild',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'StdUIExt',
			formats: ['es', 'iife'],
			fileName: (format) => (format === 'es' ? 'std-ui-ext.min.js' : 'std-ui-ext.iife.min.js'),
		},
		rollupOptions: {
			external: ['std-ui'],
			output: { globals: { 'std-ui': 'StdUI' } },
		},
	},
});
