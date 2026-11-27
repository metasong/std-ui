import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from './computed.js';
import { state } from './state.js';
import { effect } from '../effect/effect.js';

describe('DEV warning: writing a signal the running computed/effect already read', () => {
	let warn: { mock: { calls: unknown[][] }; mockRestore(): void };
	beforeEach(() => {
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => warn.mockRestore());

	const count = () => warn.mock.calls.filter(c => String(c[0]).includes('already read')).length;

	it('warns when an effect body reads a signal then writes it', () => {
		const n = state(0);
		const stop = effect(() => { n.get(); n.set(1); });
		expect(count()).toBeGreaterThan(0);
		stop();
	});

	it('does not warn when the body reads with peek() then writes', () => {
		const n = state(0);
		const before = count();
		const stop = effect(() => { n.peek(); n.set(1); });
		expect(count()).toBe(before);
		stop();
	});

	it('does not warn when the body writes a signal it never read', () => {
		const a = state(0);
		const b = state(0);
		const before = count();
		const stop = effect(() => { a.get(); b.set(1); });
		expect(count()).toBe(before);
		stop();
	});

	it('does not warn for a write in afterAction', () => {
		const n = state(0);
		const before = count();
		const stop = effect(() => { n.get(); }, () => { if (n.peek() < 3) n.set(n.peek() + 1); });
		expect(count()).toBe(before);
		stop();
	});

	it('warns for a computed that reads then writes', async () => {
		vi.resetModules(); // the warning is once-per-session; start from a fresh `once` registry
		const fresh = await import('./state.js');
		const freshComputed = (await import('./computed.js')).computed;
		const n = fresh.state(0);
		const c = freshComputed(() => { n.get(); n.set(5); return 1; });
		c.get();
		expect(count()).toBe(1);
	});

	it('writes outside any computed never warn', () => {
		const n = state(0);
		const before = count();
		n.set(1);
		expect(count()).toBe(before);
	});
});
