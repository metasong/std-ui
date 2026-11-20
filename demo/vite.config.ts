// Standalone Vite dev server for the `@std-ui/core` feature demo - independent from the
// fireworks app's own `vite.config.js` at the repo root. Run from `src/std-ui/demo`:
//
//   npx vite
//
// (or `npm run demo` from `src/std-ui`, see `package.json`).
//
// Same `esbuild.target: 'es2022'` as the root config: stage-3 decorators (used throughout
// `../core/src/**`) need `es2022` to be transpiled rather than passed through as raw `@...` syntax.
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { esbuildTs } from '../scripts/esbuild-ts.ts';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// The app uses real paths (`/bind`, `/router/...`). Vite's dev server already serves `index.html` for any
// extensionless path; for static hosting the build also writes `404.html` (a copy of `index.html`), which hosts
// such as GitHub Pages serve for unknown paths.
const spaFallback404 = (): Plugin => ({
	name: 'spa-fallback-404',
	apply: 'build',
	generateBundle(_options, bundle) {
		const index = bundle['index.html'];
		if (index?.type === 'asset') this.emitFile({ type: 'asset', fileName: '404.html', source: index.source });
	},
});

export default defineConfig({
	root: dirname,
	resolve: {
		alias: {
			'@std-ui/core': fileURLToPath(new URL('../src/core/src/index.ts', import.meta.url)),
			'@std-ui/ext': fileURLToPath(new URL('../src/ext/src/index.ts', import.meta.url)),
			'@std-ui/router/testing': fileURLToPath(new URL('../src/router/src/dev/index.ts', import.meta.url)),
			'@std-ui/router': fileURLToPath(new URL('../src/router/src/index.ts', import.meta.url)),
		},
	},
	base: '/', // absolute: deep links like /bind/ must still find /assets/...
	plugins: [esbuildTs(), spaFallback404()],
	server: {
		open: true,
		port: 5174,
	},
});
