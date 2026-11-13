// Static dev server for the browser-bundle demos. Root is the package dir (`src/std-ui`) so that
// `../dist/browser/...` in the pages resolves to a real URL (`/dist/browser/...`) instead of
// relying on Vite's `/@fs/` rewrite. Build the package first: `npm run build`.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
	root,
	server: {
		open: '/demo-browser/index.html',
		port: 5175,
		strictPort: true,
	},
});
