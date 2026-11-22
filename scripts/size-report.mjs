// Usage: node scripts/size-report.mjs   (after building std-ui and std-ui-ext)
// Writes the size tables between the SIZE markers in release.md.
// Also run `node scripts/size-map.mjs` to refresh the demo size-map page data.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const kb = n => `${(n / 1000).toFixed(2)} kB`;
const walk = d =>
	fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
		e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
	);

let readmeRows = '';
let out = '### Browser bundles (`<pkg>/dist/browser`; `std-ui-ext` keeps `std-ui` external)\n\n| File | Minified | Gzip | Brotli |\n|---|---|---|---|\n';
for (const f of [
	'src/core/dist/browser/std-ui-core.min.js',
	'src/core/dist/browser/std-ui-core.iife.min.js',
	'src/core/dist/browser/std-ui-core.release.min.js',
	'src/core/dist/browser/std-ui-core.release.iife.min.js',
	'src/ext/dist/browser/std-ui-ext.min.js',
	'src/ext/dist/browser/std-ui-ext.iife.min.js',
	'src/ext/dist/browser/std-ui-ext.release.min.js',
	'src/ext/dist/browser/std-ui-ext.release.iife.min.js',
]) {
	const b = fs.readFileSync(f);
	const row = `| \`${path.basename(f)}\` | ${kb(b.length)} | ${kb(zlib.gzipSync(b, { level: 9 }).length)} | ${kb(zlib.brotliCompressSync(b).length)} |\n`;
	out += row;
	if (f.includes('.iife.')) readmeRows += row; // the README only lists the drop-in <script> builds
}

out += '\n### npm packages (compiled `.js`, unminified; excludes maps and `.d.ts`)\n\n| Package | Files | Raw | Gzip |\n|---|---|---|---|\n';
for (const [dir, label] of [
	['src/core', 'core'],
	['src/ext', 'ext'],
]) {
	const files = walk(`${dir}/dist/esm`).filter(f => f.endsWith('.js'));
	const all = Buffer.concat(files.map(f => fs.readFileSync(f)));
	out += `| \`${label}\` | ${files.length} | ${kb(all.length)} | ${kb(zlib.gzipSync(all, { level: 9 }).length)} |\n`;
}

const file = 'release.md';
const start = '<!-- SIZE:START -->';
const end = '<!-- SIZE:END -->';
const block = `${start}\n${out}${end}`;
let doc = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# std-ui workspace\n\n## Bundle size\n\n';
doc = doc.includes(start)
	? doc.replace(new RegExp(`${start}[\\s\\S]*?${end}`), () => block)
	: `${doc.trimEnd()}\n\n${block}\n`;
fs.writeFileSync(file, doc);

// README.md: the same numbers for the IIFE bundles, between its own markers.
const readme = 'README.md';
const rStart = '<!-- SIZE:README:START -->';
const rEnd = '<!-- SIZE:README:END -->';
const rBlock = `${rStart}\n| File | Minified | Gzip | Brotli |\n|---|---|---|---|\n${readmeRows}${rEnd}`;
const readmeDoc = fs.readFileSync(readme, 'utf8');
if (readmeDoc.includes(rStart)) {
	fs.writeFileSync(readme, readmeDoc.replace(new RegExp(`${rStart}[\\s\\S]*?${rEnd}`), () => rBlock));
} else {
	console.warn(`README.md has no ${rStart} marker; its bundle table was not updated.`);
}
console.log(out);
