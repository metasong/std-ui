import { defineConfig } from 'vite';
import { esbuildTs } from '../scripts/esbuild-ts.ts';
import { resolve } from 'node:path';

export default defineConfig({
	plugins: [esbuildTs()],
	build: {
		outDir: 'dist/browser',
		emptyOutDir: true,
		minify: 'oxc',
		sourcemap: true,
		lib: {
			entry: resolve(import.meta.dirname, 'src/index.ts'),
			name: 'StdUI',
			formats: ['es', 'iife'],
			fileName: (format) => (format === 'es' ? 'std-ui.min.js' : 'std-ui.iife.min.js'),
		},
	},
});
