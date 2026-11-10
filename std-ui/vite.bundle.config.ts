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

export default defineConfig({
	plugins: [minifyEs()],
	build: {
		outDir: 'dist/browser',
		emptyOutDir: true,
		minify: 'esbuild',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'StdUI',
			formats: ['es', 'iife'],
			fileName: (format) => (format === 'es' ? 'std-ui.min.js' : 'std-ui.iife.min.js'),
		},
	},
});
