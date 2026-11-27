// Perf of `BindingCache.resolve()` (cache hit) vs calling `resolveBinding()` every render.
// Run: npx vitest run --config vitest.perf.config.ts resolve.perf
// Variants are measured interleaved, round by round, so machine-load drift hits both equally.

import { describe, it } from 'vitest';
import { state } from '../../../../reactive/index.js';
import { BindingCache, resolveBinding } from './resolve.js';

const CALLS = 200_000;
const ROUNDS = 15;

function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	return s[Math.floor(s.length / 2)]!;
}

describe('bind() binding resolution', () => {
	it('cache hit vs resolve every render', () => {
		const el = document.createElement('input');
		const s = state('a');
		const args = [s] as const;
		const cache = new BindingCache();
		let sink: unknown;
		const variants = {
			'resolveBinding': () => { for (let i = 0; i < CALLS; i++) sink = resolveBinding(args, el, 'value'); },
			'BindingCache': () => { for (let i = 0; i < CALLS; i++) sink = cache.resolve(args, el, 'value'); },
		};
		const names = Object.keys(variants) as (keyof typeof variants)[];
		const times: Record<string, number[]> = { resolveBinding: [], BindingCache: [] };
		for (const n of names) variants[n]();
		for (let r = 0; r < ROUNDS; r++) {
			for (const n of r % 2 ? [...names].reverse() : names) {
				const start = performance.now();
				variants[n]();
				times[n]!.push(performance.now() - start);
			}
		}
		void sink;
		const a = median(times.resolveBinding!), b = median(times.BindingCache!);
		console.log(`\n${CALLS} calls, median ms: resolveBinding ${a.toFixed(2)}  BindingCache ${b.toFixed(2)}  (${(a / b).toFixed(1)}x faster)`);
	});
});
