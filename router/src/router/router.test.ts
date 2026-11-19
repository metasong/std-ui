import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryNavigation } from '../dev/index.js';
import { createRouter } from './router.js';
import type { RouteDef } from '../types.js';

const setup = (routes: RouteDef[], url = '/', base = '') => {
	const navigation = createMemoryNavigation(base + url);
	const router = createRouter({ routes, navigation, base });
	return { navigation, router };
};

describe('Router', () => {
	describe.each([false, true])('guards (native precommit: %s)', (native) => {
		beforeEach(() => {
			if (native) vi.stubGlobal('NavigationPrecommitController', class {});
		});
		afterEach(() => vi.unstubAllGlobals());
		const tick = () => new Promise((r) => setTimeout(r, 0));

		it('guard string redirects', async () => {
			const { router, navigation } = setup([{ path: 'admin', guard: () => '/login' }, { path: 'login' }], '/');
			await router.start();
			await router.navigate('/admin');
			await tick();
			expect(router.location().pathname).toBe('/login');
			expect(new URL(navigation.currentEntry!.url!).pathname).toBe('/login');
		});

		it('guard false blocks and leaves the URL on the previous entry', async () => {
			const { router, navigation } = setup([{ path: '' }, { path: 'secret', guard: () => false }], '/');
			await router.start();
			await router.navigate('/secret');
			await tick();
			expect(router.location().pathname).toBe('/');
			expect(new URL(navigation.currentEntry!.url!).pathname).toBe('/');
		});

		it('beforeLeave false blocks; true allows; unregister stops it', async () => {
			const { router } = setup([{ path: 'a' }, { path: 'b' }], '/a');
			await router.start();
			let allow = false;
			const calls: string[] = [];
			const off = router.beforeLeave(({ from, to }) => {
				calls.push(from.pathname + '>' + to.pathname);
				return allow;
			});
			await router.navigate('/b');
			await tick();
			expect(router.location().pathname).toBe('/a');
			allow = true;
			await router.navigate('/b');
			expect(router.location().pathname).toBe('/b');
			expect(calls).toEqual(['/a>/b', '/a>/b']);
			off();
			allow = false;
			await router.navigate('/a');
			expect(router.location().pathname).toBe('/a');
		});

		it('a blocked back() keeps the current entry', async () => {
			const { router, navigation } = setup([{ path: 'a' }, { path: 'b' }], '/a');
			await router.start();
			await router.navigate('/b');
			router.beforeLeave(() => false);
			await router.back();
			await tick();
			expect(router.location().pathname).toBe('/b');
			expect(new URL(navigation.currentEntry!.url!).pathname).toBe('/b');
		});

		it('beforeLeave runs once when a guard redirects', async () => {
			const { router } = setup([{ path: '' }, { path: 'admin', guard: () => '/login' }, { path: 'login' }], '/');
			await router.start();
			let n = 0;
			router.beforeLeave(() => void n++);
			await router.navigate('/admin');
			await tick();
			expect(n).toBe(1);
			expect(router.location().pathname).toBe('/login');
		});
	});

	it('resolves the current URL on start', async () => {
		const { router } = setup([{ path: 'a' }], '/a');
		await router.start();
		expect(router.matches()).toHaveLength(1);
		expect(router.location().pathname).toBe('/a');
	});

	it('navigate() commits matches and params', async () => {
		const { router } = setup([{ path: 'users/:id' }]);
		await router.start();
		await router.navigate('/users/5');
		expect(router.params()).toEqual({ id: '5' });
	});

	it('strips and re-adds base', async () => {
		const { router, navigation } = setup([{ path: 'a' }], '/a', '/app');
		await router.start();
		expect(router.location().pathname).toBe('/a');
		await router.navigate('/a?x=1');
		expect(navigation.currentEntry!.url).toBe('http://router.local/app/a?x=1');
	});

	it('follows config redirects with param substitution', async () => {
		const { router } = setup([{ path: 'old/:id', redirect: '/new/:id' }, { path: 'new/:id' }]);
		await router.start();
		await router.navigate('/old/3');
		await new Promise((r) => setTimeout(r, 0));
		expect(router.location().pathname).toBe('/new/3');
	});

	it('guard returning a string redirects', async () => {
		const { router } = setup([{ path: 'admin', guard: () => '/login' }, { path: 'login' }]);
		await router.start();
		await router.navigate('/admin');
		await new Promise((r) => setTimeout(r, 0));
		expect(router.location().pathname).toBe('/login');
	});

	it('guard returning false blocks and reverts the URL', async () => {
		const { router, navigation } = setup([{ path: '' }, { path: 'secret', guard: () => false }]);
		await router.start();
		await router.navigate('/secret');
		await new Promise((r) => setTimeout(r, 0));
		expect(router.location().pathname).toBe('/');
		expect(new URL(navigation.currentEntry!.url!).pathname).toBe('/');
	});

	it('runs loaders and exposes data; loader errors set status', async () => {
		const ok: RouteDef = { path: 'ok', load: () => 42 };
		const bad: RouteDef = { path: 'bad', load: () => { throw new Error('boom'); } };
		const { router } = setup([ok, bad]);
		await router.start();
		await router.navigate('/ok');
		expect(router.data().get(ok)).toBe(42);
		await router.navigate('/bad');
		expect(router.status()).toBe('error');
		expect((router.error() as Error).message).toBe('boom');
	});

	it('a superseded navigation never commits', async () => {
		const slow: RouteDef = { path: 'slow', load: () => new Promise<void>((r) => setTimeout(r, 20)) };
		const { router } = setup([slow, { path: 'fast' }]);
		await router.start();
		const first = router.navigate('/slow');
		await router.navigate('/fast');
		await first;
		await new Promise((r) => setTimeout(r, 40));
		expect(router.location().pathname).toBe('/fast');
	});

	it('back() re-resolves the previous entry', async () => {
		const { router } = setup([{ path: 'a' }, { path: 'b' }], '/a');
		await router.start();
		await router.navigate('/b');
		await router.back();
		expect(router.location().pathname).toBe('/a');
	});

	it('addRoute() registers and unregisters', async () => {
		const { router } = setup([]);
		await router.start();
		const remove = router.addRoute({ path: 'late' });
		await router.navigate('/late');
		expect(router.matches()).toHaveLength(1);
		remove();
		await new Promise((r) => setTimeout(r, 0));
		expect(router.matches()).toHaveLength(0);
	});

	describe('beforeunload guard', () => {
		const fire = (): boolean => {
			const e = new Event('beforeunload', { cancelable: true });
			window.dispatchEvent(e);
			return e.defaultPrevented;
		};

		it('prompts only while started and an unload check reports unsaved work', async () => {
			const { router } = setup([{ path: '' }]);
			let dirty = true;
			const off = router.beforeLeave(() => true, { unload: () => dirty });
			expect(fire()).toBe(false); // not started yet
			await router.start();
			expect(fire()).toBe(true);
			dirty = false;
			expect(fire()).toBe(false);
			dirty = true;
			off();
			expect(fire()).toBe(false); // unregistered
			router.beforeLeave(() => true, { unload: () => dirty });
			expect(fire()).toBe(true);
			router.stop();
			expect(fire()).toBe(false);
		});

		it('hooks without an unload check never add a prompt', async () => {
			const { router } = setup([{ path: '' }]);
			await router.start();
			router.beforeLeave(() => false);
			expect(fire()).toBe(false);
		});
	});

	it('throws without a Navigation API', () => {
		expect(() => createRouter({})).toThrow(/Navigation API/);
	});
});
