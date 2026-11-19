import { describe, expect, it } from 'vitest';
import { createMemoryNavigation } from '../dev/index.js';
import { createRouter } from './router.js';
import type { RouteDef } from '../types.js';

const setup = (routes: RouteDef[], url = '/', base = '') => {
	const navigation = createMemoryNavigation(base + url);
	const router = createRouter({ routes, navigation, base });
	return { navigation, router };
};

describe('Router', () => {
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

	it('throws without a Navigation API', () => {
		expect(() => createRouter({})).toThrow(/Navigation API/);
	});
});
