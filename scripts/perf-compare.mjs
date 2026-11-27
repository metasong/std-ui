// Compares perf runs written by signal-binding.perf.ts (PERF_OUT=...). Usage:
//   node scripts/perf-compare.mjs <dir with *.json> [labelA labelB]
// Runs are grouped by `label` (PERF_LABEL, default `baseline` = signal handling stubbed off, or `feature`).
// For each metric the best (lowest) value across a group's runs is used, since noise only slows a run down.
// Prints A vs B for every metric; with two labels given, B is compared against A (+ means B is slower/heavier).
import fs from 'node:fs';
import path from 'node:path';

const [dir, argA, argB] = process.argv.slice(2);
const groups = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
	const run = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
	const label = run.label ?? (run.baseline ? 'baseline' : 'feature');
	(groups[label] ??= []).push(run.results);
}
const labels = Object.keys(groups);
const A = argA ?? 'baseline', B = argB ?? 'feature';
console.log(`runs: ${labels.map(l => `${l} ${groups[l].length}`).join(', ')}\n`);

const best = (runs, title, key) => {
	const xs = (runs ?? []).map(r => r[title]?.[key]?.min).filter(Number.isFinite);
	return xs.length ? Math.min(...xs) : NaN;
};
const pct = (b, a) => (Number.isFinite(a) && Number.isFinite(b) ? `${b >= a ? '+' : ''}${(((b - a) / a) * 100).toFixed(1)}%` : 'n/a');
const num = x => (Number.isFinite(x) ? x.toFixed(4) : 'n/a');
const keysOf = title => [...new Set(Object.values(groups).flat().flatMap(r => Object.keys(r[title] ?? {})))];
const titles = [...new Set(Object.values(groups).flat().flatMap(r => Object.keys(r)))];

for (const mode of ['plain', 'signal']) {
	console.log(`${mode} rows: ${A} -> ${B} (+ means ${B} is slower/heavier)`);
	for (const t of titles) {
		for (const key of keysOf(t).filter(k => k.endsWith(mode))) {
			const a = best(groups[A], t, key), b = best(groups[B], t, key);
			console.log(`  ${t.padEnd(20)} ${key.padEnd(14)} ${A} ${num(a)}  ${B} ${num(b)}  ${pct(b, a)}`);
		}
	}
	console.log('');
}
console.log(`signal/plain within ${B}`);
for (const t of titles) {
	for (const n of [...new Set(keysOf(t).map(k => k.split(' ')[0]))]) {
		const p = best(groups[B], t, `${n} plain`), s = best(groups[B], t, `${n} signal`);
		console.log(`  ${t.padEnd(20)} ${n.padEnd(8)} plain ${num(p)}  signal ${num(s)}  signal/plain ${(s / p).toFixed(2)}x`);
	}
}