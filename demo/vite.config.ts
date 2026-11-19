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

// The router demo uses real paths (`/router-demo/users/3`). Serve its page for any extensionless
// path under it, and pin a <base> so the page's relative URLs keep working on deep routes.
// Dev server only; the production build has no such fallback.
const routerDemoSpa = (): Plugin => ({
	name: 'router-demo-spa',
	apply: 'serve',
	configureServer(server) {
		server.middlewares.use((req, _res, next) => {
			const [path, query = ''] = (req.url ?? '').split('?');
			if (path!.startsWith('/router-demo/') && !path!.split('/').pop()!.includes('.')) {
				req.url = '/router-demo/index.html' + (query ? `?${query}` : '');
			}
			next();
		});
	},
	transformIndexHtml(_html, ctx) {
		if (!ctx.path.startsWith('/router-demo/')) return;
		return [{ tag: 'base', attrs: { href: '/router-demo/' }, injectTo: 'head-prepend' }];
	},
});

export default defineConfig({
	root: dirname,
	resolve: {
		alias: {
			'@std-ui/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
			'@std-ui/ext': fileURLToPath(new URL('../ext/src/index.ts', import.meta.url)),
			'@std-ui/router': fileURLToPath(new URL('../router/src/index.ts', import.meta.url)),
		},
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
	plugins: [esbuildTs(), routerDemoSpa()],
	server: {
		open: true,
		port: 5174,
	},
});
