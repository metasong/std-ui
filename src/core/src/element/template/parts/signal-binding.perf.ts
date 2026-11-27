// Perf profile of per-part signal bindings (`${sig}`) vs plain reads (`${sig.get()}`).
//
// Run: see the Perf profile section of `../signal-binding-plan.md`.
// - Variants are measured interleaved, round by round, so machine-load drift hits all of them equally.
// - PERF_BASELINE=1 stubs `hasSignal()` to `false`, i.e. the code as it behaved before this feature
//   (no signal handling in any part). Compare the `plain` rows of a baseline run and a normal run to see
//   what the feature costs templates that never use signals.
// - PERF_OUT=<file> writes the results as JSON for scripts/perf-compare.mjs.
// jsdom DOM cost inflates absolute numbers; compare the variants, not the totals.

import { describe, it, vi } from 'vitest';
import { state, type State } from '../../../reactive/index.js';
import { effect, whenFlushed } from '../../../reactive/effect/main.js';
import { render } from '../render.js';
import { t } from '../tag-funcs/html/index.js';

const { env, BASELINE } = vi.hoisted(() => {
	const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
	return { env, BASELINE: env.PERF_BASELINE === '1' };
});

vi.mock('./signal-binding.js', async importOriginal => {
	const actual = await importOriginal<typeof import('./signal-binding.js')>();
	return BASELINE ? { ...actual, hasSignal: () => false } : actual;
});

type Mode = 'plain' | 'signal';
const MODES: Mode[] = ['plain', 'signal'];
const SIZES = [10, 100, 1000];
const ROUNDS = 15;

function make(n: number, mode: Mode) {
	const sigs: State<number>[] = Array.from({ length: n }, (_, i) => state(i));
	const container = document.createElement('div');
	const view = () => t`<ul>${sigs.map(s => t`<li data-v=${mode === 'plain' ? s.get() : s}>${mode === 'plain' ? s.get() : s}</li>`)}</ul>`;
	const dispose = effect(() => render(view(), container));
	return { sigs, container, dispose };
}

function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	return s[Math.floor(s.length / 2)]!;
}

function opsFor(n: number): number {
	return n >= 1000 ? 8 : n >= 100 ? 30 : 100;
}

/** Runs `ops` calls of `fn`, returns the median ms per call. */
async function sample(ops: number, fn: () => unknown | Promise<unknown>): Promise<number> {
	const times: number[] = [];
	for (let i = 0; i < ops; i++) {
		const start = performance.now();
		await fn();
		times.push(performance.now() - start);
	}
	return median(times);
}

type Stats = { median: number; min: number };
type Results = Record<string, Record<string, Stats>>;
const results: Results = {};

/** Measures `bodies` interleaved over ROUNDS rounds (rotating the start so no variant always goes first). */
async function interleaved(title: string, n: number, bodies: Record<Mode, () => unknown | Promise<unknown>>) {
	const ops = opsFor(n);
	for (const m of MODES) for (let i = 0; i < 3; i++) await bodies[m](); // warm up
	const rounds: Record<Mode, number[]> = { plain: [], signal: [] };
	for (let r = 0; r < ROUNDS; r++) {
		const order = r % 2 ? [...MODES].reverse() : MODES;
		for (const m of order) rounds[m].push(await sample(ops, bodies[m]));
	}
	results[title] ??= {};
	for (const m of MODES) results[title][`N=${n} ${m}`] = { median: median(rounds[m]), min: Math.min(...rounds[m]) };
}

describe(`signal binding perf (${BASELINE ? 'baseline: signal handling off' : 'feature on'})`, () => {
	it.skipIf(!!env.PERF_HEAP_MODE)('update one row of N', async () => {
		for (const n of SIZES) {
			const ctx = { plain: make(n, 'plain'), signal: make(n, 'signal') };
			let i = 1000;
			await interleaved('update one row', n, {
				plain: async () => { ctx.plain.sigs[n >> 1]!.set(++i); await whenFlushed(); },
				signal: async () => { ctx.signal.sigs[n >> 1]!.set(++i); await whenFlushed(); },
			});
			ctx.plain.dispose(); ctx.signal.dispose();
		}
	});

	it.skipIf(!!env.PERF_HEAP_MODE)('update all N rows in one flush', async () => {
		for (const n of SIZES) {
			const ctx = { plain: make(n, 'plain'), signal: make(n, 'signal') };
			let i = 1000;
			const all = (c: ReturnType<typeof make>) => async () => { i++; for (const s of c.sigs) s.set(i); await whenFlushed(); };
			await interleaved('update all', n, { plain: all(ctx.plain), signal: all(ctx.signal) });
			ctx.plain.dispose(); ctx.signal.dispose();
		}
	});

	it.skipIf(!!env.PERF_HEAP_MODE)('create + dispose N rows', async () => {
		for (const n of SIZES) {
			await interleaved('create + dispose', n, {
				plain: () => make(n, 'plain').dispose(),
				signal: () => make(n, 'signal').dispose(),
			});
		}
	});

	// Heap is measured in a fresh process per mode (PERF_HEAP_MODE=plain|signal): after a
	// GC, V8 sweeps lazily and jsdom frees node wrappers late, so a second reading in the same process is
	// skewed by the first one's garbage. A small warm-up absorbs one-time costs (template cache, jsdom).
	it.skipIf(!env.PERF_HEAP_MODE)('heap per row (2000 rows, 2 bindings each)', async () => {
		const { gc, process } = globalThis as unknown as {
			gc?: () => void;
			process: { memoryUsage(): { heapUsed: number } };
		};
		if (!gc) throw new Error('run node with --expose-gc (NODE_OPTIONS=--expose-gc)');
		const mode = env.PERF_HEAP_MODE as Mode;
		const n = 2000;
		const settle = async () => { await new Promise(r => setTimeout(r, 50)); gc(); await new Promise(r => setTimeout(r, 50)); gc(); };
		for (let k = 0; k < 3; k++) make(100, mode).dispose();
		await settle();
		const before = process.memoryUsage().heapUsed;
		const ctx = make(n, mode);
		await settle();
		const perRow = (process.memoryUsage().heapUsed - before) / n;
		results['heap bytes per row'] = { [`N=${n} ${mode}`]: { median: perRow, min: perRow } };
		void ctx;
	});
	it('writes results', () => {
		const out = env.PERF_OUT;
		if (out) {
			const nodeProcess = (globalThis as unknown as { process: { getBuiltinModule(id: string): { writeFileSync(path: string, data: string): void } } }).process;
			nodeProcess.getBuiltinModule('node:fs').writeFileSync(out, JSON.stringify({ baseline: BASELINE, label: env.PERF_LABEL ?? (BASELINE ? 'baseline' : 'feature'), results }, null, 2));
		}
		for (const [title, rows] of Object.entries(results)) {
			console.log(`\n${title}`);
			for (const [k, v] of Object.entries(rows)) console.log(`  ${k.padEnd(14)} median ${v.median.toFixed(4)}  min ${v.min.toFixed(4)}`);
		}
	});
});
