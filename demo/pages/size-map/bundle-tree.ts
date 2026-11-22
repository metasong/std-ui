import type { BundleStat, SizeNode } from './data.js';

const fileNode = (f: BundleStat, group: string): SizeNode => ({
	name: f.file.replace(/^std-ui-/, ''),
	path: `${group}/${f.file}`,
	size: f.brotli,
	raw: f.raw,
});

const groupNode = (name: string, files: readonly BundleStat[]): SizeNode => ({
	name,
	path: name,
	size: files.reduce((s, f) => s + f.brotli, 0),
	raw: files.reduce((s, f) => s + f.raw, 0),
	children: files.map((f) => fileNode(f, name)),
});

/** Browser bundles: `core` / `ext` groups, each file one block (area = brotli). */
export const browserBundleTree = (bundles: readonly BundleStat[]): SizeNode => {
	const children = (['core', 'ext'] as const)
		.map((pkg) => groupNode(pkg, bundles.filter((b) => b.file.includes(`-${pkg}.`))))
		.filter((g) => g.size > 0);
	return { name: 'browser', path: 'browser', size: children.reduce((s, c) => s + c.size, 0), children };
};