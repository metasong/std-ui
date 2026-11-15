// Usage: node scripts/size-report.mjs   (after building std-ui and std-ui-ext)
// Writes the size tables between the SIZE markers in the root README.md.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const kb = n => `${(n / 1024).toFixed(2)} kB`;
const walk = d =>
	fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
		e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
	);

let out = '### Browser bundles (`std-ui/dist/browser`)\n\n| File | Minified | Gzip | Brotli |\n|---|---|---|---|\n';
for (const f of ['std-ui.min.js', 'std-ui.iife.min.js']) {
	const b = fs.readFileSync(`std-ui/dist/browser/${f}`);
	out += `| \`${f}\` | ${kb(b.length)} | ${kb(zlib.gzipSync(b, { level: 9 }).length)} | ${kb(zlib.brotliCompressSync(b).length)} |\n`;
}

out += '\n### npm packages (compiled `.js`, unminified; excludes maps and `.d.ts`)\n\n| Package | Files | Raw | Gzip |\n|---|---|---|---|\n';
for (const d of ['std-ui', 'std-ui-ext']) {
	const files = walk(`${d}/dist`).filter(f => f.endsWith('.js') && !f.includes('browser'));
	const all = Buffer.concat(files.map(f => fs.readFileSync(f)));
	out += `| \`${d}\` | ${files.length} | ${kb(all.length)} | ${kb(zlib.gzipSync(all, { level: 9 }).length)} |\n`;
}

const start = '<!-- SIZE:START -->';
const end = '<!-- SIZE:END -->';
const block = `${start}\n${out}${end}`;
let readme = fs.existsSync('README.md') ? fs.readFileSync('README.md', 'utf8') : '# std-ui workspace\n\n## Bundle size\n\n';
readme = readme.includes(start)
	? readme.replace(new RegExp(`${start}[\\s\\S]*?${end}`), () => block)
	: `${readme.trimEnd()}\n\n${block}\n`;
fs.writeFileSync('README.md', readme);
console.log(out);
