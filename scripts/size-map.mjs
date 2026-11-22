// Usage: node scripts/size-map.mjs   (after `npm run build`; or just `npm run size`)
// Writes `demo/pages/size-map/bundle-sizes.json` for the size-map demo page.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUNDLES = [
	// 'src/core/dist/browser/std-ui-core.min.js',
	// 'src/core/dist/browser/std-ui-core.iife.min.js',
	'src/core/dist/browser/std-ui-core.release.min.js',
	'src/core/dist/browser/std-ui-core.release.iife.min.js',
	'src/ext/dist/browser/std-ui-ext.release.min.js',
	'src/ext/dist/browser/std-ui-ext.release.iife.min.js',
];
const PACKAGES = [
	['core', 'src/core'],
	['ext', 'src/ext'],
];
const DEST = 'demo/pages/size-map/bundle-sizes.json';

const gzip = buf => zlib.gzipSync(buf, { level: 9 }).length;
const posix = p => p.split(path.sep).join('/');

const walk = dir =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
		e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
	);

const readBuilt = file => {
	if (!fs.existsSync(file)) {
		console.error(`Missing ${file} - run \`npm run build\` first (or use \`npm run size\`).`);
		process.exit(1);
	}
	return fs.readFileSync(file);
};

const bundleStat = file => {
	const buf = readBuilt(file);
	return { file: path.basename(file), raw: buf.length, gzip: gzip(buf), brotli: zlib.brotliCompressSync(buf).length };
};

/**
 * Folder tree of `<dir>/dist/esm/**.js`. Every node has `size` (gzip bytes), `raw` and a
 * slash-separated `path` from the package root, e.g. `core/element/template`.
 */
function packageTree(label, dir) {
	const esm = `${dir}/dist/esm`;
	readBuilt(`${esm}/index.js`);
	const root = { name: label, path: label, dirs: new Map(), files: [] };
	for (const file of walk(esm).filter(f => f.endsWith('.js'))) {
		const buf = fs.readFileSync(file);
		const parts = posix(path.relative(esm, file)).split('/');
		let dirNode = root;
		for (const part of parts.slice(0, -1)) {
			if (!dirNode.dirs.has(part)) dirNode.dirs.set(part, { name: part, path: `${dirNode.path}/${part}`, dirs: new Map(), files: [] });
			dirNode = dirNode.dirs.get(part);
		}
		const name = parts.at(-1);
		dirNode.files.push({ name, path: `${dirNode.path}/${name}`, size: gzip(buf), raw: buf.length });
	}
	const finalize = node => {
		const children = [...[...node.dirs.values()].map(finalize), ...node.files].filter(c => c.size > 0);
		children.sort((a, b) => b.size - a.size);
		return {
			name: node.name,
			path: node.path,
			size: children.reduce((s, c) => s + c.size, 0),
			raw: children.reduce((s, c) => s + c.raw, 0),
			children,
		};
	};
	return finalize(root);
}

const out = {
	generatedAt: new Date().toISOString(),
	bundles: BUNDLES.map(bundleStat),
	packages: PACKAGES.map(([label, dir]) => packageTree(label, dir)),
};

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, JSON.stringify(out, null, '\t') + '\n'); // tab-indented so diffs of the committed file stay readable
console.log(`Wrote ${DEST} (${out.bundles.length} bundles, ${out.packages.length} package trees)`);
