import { defineConfig } from 'vite';
import { esbuildTs } from '../../scripts/esbuild-ts.ts';
import { resolve } from 'node:path';

// `package.json` `sideEffects` only names the published `dist/esm/**` files, so the bundler treats
// `src/**` as side-effect-free and drops the top-level `registerCustomAttribute(...)` calls that make
// `attr=` / `?attr=` / `.prop=` / `@event=` bindings work. Keep those modules (same fix as demo/vite.config.ts).
const keepCustomAttributes = {
	name: 'std-ui-keep-custom-attributes',
	enforce: 'pre' as const,
	transform(code: string, id: string) {
		if (/[\\/]custom-attributes[\\/]/.test(id.split('?')[0]!) && !id.endsWith('.test.ts')) {
			return { code, map: null, moduleSideEffects: true };
		}
		return null;
	},
};
export default defineConfig({
	plugins: [keepCustomAttributes, esbuildTs()],
	build: {
		outDir: 'dist/browser',
		emptyOutDir: true,
		minify: 'oxc',
		sourcemap: true,
		lib: {
			entry: resolve(import.meta.dirname, 'src/index.ts'),
			name: 'StdUI',
			formats: ['es', 'iife'],
			fileName: (format) => (format === 'es' ? 'std-ui-core.min.js' : 'std-ui-core.iife.min.js'),
		},
	},
});
