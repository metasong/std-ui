import { defineConfig } from 'vite';
import { esbuildTs } from '../../scripts/esbuild-ts.ts';
import { resolve } from 'node:path';
import { minify } from 'terser';

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

// Second minify pass over oxc's output: ~2% smaller IIFE, and the ES build (where oxc keeps
// whitespace and top-level names) ~25% smaller. No `unsafe`/`pure_getters`: signals rely on
// getter reads for dependency tracking.
const terserPass = {
	name: 'std-ui-terser-pass',
	enforce: 'post' as const,
	async generateBundle(_: unknown, bundle: Record<string, any>) {
		for (const [name, chunk] of Object.entries(bundle)) {
			if (chunk.type !== 'chunk') continue;
			const map = bundle[name + '.map'];
			const result = await minify(chunk.code, {
				ecma: 2022,
				module: chunk.format === 'es',
				// Not for the IIFE: its top-level `var StdUI = ...` is the public global, which `toplevel` would mangle/drop.
				toplevel: chunk.format === 'es',
				compress: { passes: 2 },
				sourceMap: map ? { content: map.source.toString(), asObject: true } as any : false,
			});
			chunk.code = result.code!;
			if (map && result.map) map.source = JSON.stringify(result.map);
		}
	},
};

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
	plugins: [releaseFlag, keepCustomAttributes, esbuildTs(), terserPass],
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
