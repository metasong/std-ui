// Standalone Vite dev server for the `std-ui` feature demo — independent from the
// fireworks app's own `vite.config.js` at the repo root. Run from `src/std-ui/demo`:
//
//   npx vite
//
// (or `npm run demo` from `src/std-ui`, see `package.json`).
//
// Same `esbuild.target: 'es2022'` as the root config: stage-3 decorators (used throughout
// `../std-ui/src/**`) need `es2022` to be transpiled rather than passed through as raw `@...` syntax.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	root: dirname,
	resolve: {
		alias: { 'std-ui': fileURLToPath(new URL('../std-ui/src/index.ts', import.meta.url)) },
	},
	base: './',
	build: {
		rollupOptions: {
			input: {
				main: `${dirname}/index.html`,
				features: `${dirname}/feature-demo/index.html`,
				bind: `${dirname}/feature-demo/bind.html`,
				slot: `${dirname}/feature-demo/slot.html`,
				virtualize: `${dirname}/feature-demo/virtualize.html`,
				integration: `${dirname}/integration-demo/index.html`,
			},
		},
	},
	esbuild: {
		target: 'es2022',
	},
	server: {
		open: true,
		port: 5174,
	},
});
