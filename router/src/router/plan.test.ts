import { describe, expect, it } from 'vitest';
import type { RouteDef, RouteLocation } from '../types.js';
import { LeaveHooks } from './leave-hooks.js';
import { planNavigation, type PlanInput } from './plan.js';

const loc = (pathname: string): RouteLocation => ({ pathname, search: '', hash: '', state: undefined });

const input = (routes: RouteDef[], to: string, extra: Partial<PlanInput> = {}): PlanInput => ({
	routes,
	leave: new LeaveHooks(),
	from: loc('/'),
	to: loc(to),
	leaving: true,
	signal: new AbortController().signal,
	isStale: () => false,
	...extra,
});

describe('planNavigation', () => {
	it('plans a plain match as go with the same location object', async () => {
		const to = loc('/a');
		const plan = await planNavigation(input([{ path: 'a' }], '/a', { to }));
		expect(plan).toMatchObject({ kind: 'go', to });
		expect(plan?.kind === 'go' && plan.matches).toHaveLength(1);
	});

	it('follows redirect attributes and guard redirects to the final target', async () => {
		const routes: RouteDef[] = [
			{ path: 'a', redirect: '/b' },
			{ path: 'b', guard: () => '/c' },
			{ path: 'c' },
		];
		const plan = await planNavigation(input(routes, '/a'));
		expect(plan?.kind === 'go' && plan.to.pathname).toBe('/c');
	});

	it('runs beforeLeave hooks once, even across redirects', async () => {
		const leave = new LeaveHooks();
		let calls = 0;
		leave.add(() => void calls++);
		await planNavigation(input([{ path: 'a', redirect: '/b' }, { path: 'b' }], '/a', { leave }));
		expect(calls).toBe(1);
	});

	it('skips beforeLeave hooks when not leaving', async () => {
		const leave = new LeaveHooks();
		let calls = 0;
		leave.add(() => void calls++);
		await planNavigation(input([{ path: 'a' }], '/a', { leave, leaving: false }));
		expect(calls).toBe(0);
	});

	it('blocks when a hook or a guard returns false', async () => {
		const leave = new LeaveHooks();
		leave.add(() => false);
		expect(await planNavigation(input([{ path: 'a' }], '/a', { leave }))).toEqual({ kind: 'block' });
		expect(await planNavigation(input([{ path: 'a', guard: () => false }], '/a'))).toEqual({ kind: 'block' });
	});

	it('turns a throwing guard into a go plan carrying the error', async () => {
		const boom = new Error('boom');
		const plan = await planNavigation(
			input([{ path: 'a', guard: () => { throw boom; } }], '/a'),
		);
		expect(plan).toMatchObject({ kind: 'go', error: boom });
		expect(plan?.kind === 'go' && plan.matches).toHaveLength(1);
	});

	it('reports a redirect loop as an error plan', async () => {
		const routes: RouteDef[] = [{ path: 'a', redirect: '/b' }, { path: 'b', redirect: '/a' }];
		const plan = await planNavigation(input(routes, '/a'));
		expect(plan?.kind === 'go' && (plan.error as Error).message).toMatch(/Too many redirects/);
	});

	it('returns null when superseded mid-plan, including when a guard then throws', async () => {
		let stale = false;
		const slow: RouteDef = {
			path: 'a',
			guard: async () => {
				stale = true;
				throw new Error('late');
			},
		};
		expect(await planNavigation(input([slow], '/a', { isStale: () => stale }))).toBeNull();
	});
});
