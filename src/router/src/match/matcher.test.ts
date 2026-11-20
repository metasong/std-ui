import { describe, expect, it } from 'vitest';
import { fillParams, matchRoutes } from './matcher.js';
import type { RouteDef } from '../types.js';

const r = (path: string, extra: Partial<RouteDef> = {}): RouteDef => ({ path, ...extra });

describe('matchRoutes', () => {
	it('matches static and param segments', () => {
		const m = matchRoutes([r('users/:id')], '/users/42');
		expect(m?.[0]?.params).toEqual({ id: '42' });
	});

	it('returns null when nothing matches', () => {
		expect(matchRoutes([r('a')], '/b')).toBeNull();
	});

	it('static beats param beats splat regardless of order', () => {
		const splat = r('*', { element: 'nf-page' });
		const param = r(':id', { element: 'p-page' });
		const stat = r('new', { element: 's-page' });
		expect(matchRoutes([splat, param, stat], '/new')?.[0]?.route).toBe(stat);
		expect(matchRoutes([splat, param, stat], '/7')?.[0]?.route).toBe(param);
		expect(matchRoutes([splat, param, stat], '/x/y')?.[0]?.route).toBe(splat);
	});

	it('an empty path beats a splat, and an exact path beats a param or splat that could also match', () => {
		const home = r('/');
		const users = r('users');
		const param = r(':id');
		const splat = r('*');
		expect(matchRoutes([splat, home], '/')![0]!.route).toBe(home);
		expect(matchRoutes([splat, param, users], '/users')![0]!.route).toBe(users);
		expect(matchRoutes([splat, r('a/:b?'), r('a')], '/a')![0]!.route.path).toBe('a');
	});

	it('nests children, accumulating params', () => {
		const child = r(':id');
		const parent = r('users', { children: [child] });
		const m = matchRoutes([parent], '/users/9')!;
		expect(m.map((x) => x.route)).toEqual([parent, child]);
		expect(m[1]!.params).toEqual({ id: '9' });
	});

	it('index route matches the parent path exactly', () => {
		const index: RouteDef = { index: true };
		const parent = r('users', { children: [r(':id'), index] });
		expect(matchRoutes([parent], '/users')!.at(-1)!.route).toBe(index);
	});

	it('optional param and splat param', () => {
		expect(matchRoutes([r('a/:b?')], '/a')).not.toBeNull();
		expect(matchRoutes([r('files/*')], '/files/x/y')![0]!.params['*']).toBe('x/y');
	});

	it('decodes params', () => {
		expect(matchRoutes([r(':q')], '/a%20b')![0]!.params.q).toBe('a b');
	});
});

describe('fillParams', () => {
	it('substitutes params', () => {
		expect(fillParams('/users/:id', { id: 'a b' })).toBe('/users/a%20b');
	});
});
