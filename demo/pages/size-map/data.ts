import bundleSizes from './bundle-sizes.json';

export type SizeNode = {
	readonly name: string;
	/** Slash-separated path from the package root (also set on folders). */
	readonly path?: string;
	/** Gzip bytes; for a folder, the sum of its children. */
	readonly size: number;
	readonly raw?: number;
	readonly children?: readonly SizeNode[];
};

export type BundleStat = {
	readonly file: string;
	readonly raw: number;
	readonly gzip: number;
	readonly brotli: number;
};

export type BundleSizes = {
	readonly generatedAt: string;
	readonly bundles: readonly BundleStat[];
	readonly packages: readonly SizeNode[];
};

export const SIZE_DATA: BundleSizes = bundleSizes;

export const formatKb = (bytes: number, digits = 2): string => `${(bytes / 1024).toFixed(digits)} kB`;