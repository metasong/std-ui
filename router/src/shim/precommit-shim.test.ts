import { describe, expect, it } from 'vitest';
import { createMemoryNavigation } from '../dev/index.js';
import { withPrecommit } from './precommit-shim.js';
import type { NavigateEventLike } from '../navigation/types.js';

const path = (nav: { currentEntry: { url: string | null } | null }): string => new URL(nav.currentEntry!.url!).pathname;
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('withPrecommit', () => {
	it('returns the navigation untouched when the engine supports precommit natively', () => {
		const nav = createMemoryNavigation();
		expect(withPrecommit(nav, true)).toBe(nav);
	});

	it('presents events as cancelable', () => {
		const nav = withPrecommit(createMemoryNavigation(), false);
		let cancelable: boolean | undefined;
		nav.addEventListener('navigate', (e) => {
			cancelable = e.cancelable;
		});
		void nav.navigate('/x');
		expect(cancelable).toBe(true);
	});

	it('reverts the committed entry when precommitHandler rejects', async () => {
		const nav = withPrecommit(createMemoryNavigation('/'), false);
		nav.addEventListener('navigate', (e) =>
			(e as NavigateEventLike).intercept({
				precommitHandler: async () => {
					throw new DOMException('no', 'AbortError');
				},
			}),
		);
		await nav.navigate('/x').finished?.catch(() => {});
		await tick();
		expect(path(nav)).toBe('/');
	});

	it('does not revert a navigation that was already superseded', async () => {
		const nav = withPrecommit(createMemoryNavigation('/'), false);
		nav.addEventListener('navigate', (e) => {
			const ev = e as NavigateEventLike;
			const to = new URL(ev.destination.url).pathname;
			ev.intercept({
				precommitHandler: async () => {
					await tick();
					if (to === '/slow') throw new DOMException('late', 'AbortError');
				},
			});
		});
		const first = nav.navigate('/slow').finished?.catch(() => {});
		const second = nav.navigate('/fast').finished?.catch(() => {});
		await Promise.all([first, second]);
		await tick();
		expect(path(nav)).toBe('/fast');
	});

	it('redirect replaces the entry and runs the original handler without aborting its signal', async () => {
		const nav = withPrecommit(createMemoryNavigation('/'), false);
		let abortedInHandler: boolean | undefined;
		let handled = 0;
		nav.addEventListener('navigate', (e) => {
			const ev = e as NavigateEventLike;
			if (new URL(ev.destination.url).pathname !== '/x') return;
			ev.intercept({
				precommitHandler: async (controller) => controller.redirect('/y', { history: 'replace' }),
				handler: () => {
					handled++;
					abortedInHandler = ev.signal.aborted;
				},
			});
		});
		// The original navigation reports AbortError once its redirect supersedes it, as in a browser.
		await nav.navigate('/x').finished?.catch(() => {});
		expect(handled).toBe(1);
		expect(abortedInHandler).toBe(false);
		expect(path(nav)).toBe('/y');
		await nav.back().finished;
		expect(path(nav)).toBe('/'); // '/x' never became its own entry
	});

	it('removeEventListener removes the wrapped listener', () => {
		const nav = withPrecommit(createMemoryNavigation(), false);
		let calls = 0;
		const listener = (): void => void calls++;
		nav.addEventListener('navigate', listener);
		nav.removeEventListener('navigate', listener);
		void nav.navigate('/x');
		expect(calls).toBe(0);
	});
});
