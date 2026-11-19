import type { RouteDef, RouteMatch } from '../types.js';

type Segment =
	| { kind: 'static'; value: string }
	| { kind: 'param'; name: string; optional: boolean }
	| { kind: 'splat' };

const compiled = new WeakMap<RouteDef, Segment[]>();

export function splitPath(path: string): string[] {
	return path.split('/').filter(Boolean);
}

function segmentsOf(route: RouteDef): Segment[] {
	let segs = compiled.get(route);
	// Not cached across `path` edits: markup routes mutate `path` only before registration.
	if (!segs) {
		segs = route.index ? [] : splitPath(route.path ?? '').map((s): Segment => {
			if (s === '*') return { kind: 'splat' };
			if (s.startsWith(':')) {
				const optional = s.endsWith('?');
				return { kind: 'param', name: s.slice(1, optional ? -1 : undefined), optional };
			}
			return { kind: 'static', value: s };
		});
		compiled.set(route, segs);
	}
	return segs;
}

const RANK = { static: 3, param: 2, splat: 0 } as const;
// A route that has already ended is an exact fit, so it beats a param or splat that could still absorb more.
const ENDED = 2.5;

// Static beats ended beats param beats splat, segment by segment; ties keep declaration order (stable sort).
function compareRoutes(a: RouteDef, b: RouteDef): number {
	if (a.index !== b.index) return a.index ? -1 : 1;
	const sa = segmentsOf(a);
	const sb = segmentsOf(b);
	for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
		const ra = sa[i] ? RANK[sa[i]!.kind] : ENDED;
		const rb = sb[i] ? RANK[sb[i]!.kind] : ENDED;
		if (ra !== rb) return rb - ra;
	}
	return 0;
}

/** Consumes the route's own segments from `rest`; null when they do not match. */
function consume(
	segs: Segment[],
	rest: string[],
): { used: number; params: Record<string, string> } | null {
	const params: Record<string, string> = {};
	let i = 0;
	for (const seg of segs) {
		if (seg.kind === 'splat') {
			params['*'] = rest.slice(i).map(decodeURIComponent).join('/');
			return { used: rest.length, params };
		}
		const part = rest[i];
		if (part === undefined) {
			if (seg.kind === 'param' && seg.optional) continue;
			return null;
		}
		if (seg.kind === 'static') {
			if (seg.value !== part) return null;
		} else {
			params[seg.name] = decodeURIComponent(part);
		}
		i++;
	}
	return { used: i, params };
}

function walk(
	routes: readonly RouteDef[],
	rest: string[],
	parentParams: Record<string, string>,
	consumed: string[],
): RouteMatch[] | null {
	for (const route of [...routes].sort(compareRoutes)) {
		const hit = consume(segmentsOf(route), rest);
		if (!hit) continue;
		const params = { ...parentParams, ...hit.params };
		const used = [...consumed, ...rest.slice(0, hit.used)];
		const match: RouteMatch = { route, params, pathname: '/' + used.join('/') };
		const remaining = rest.slice(hit.used);

		if (route.children?.length) {
			const sub = walk(route.children, remaining, params, used);
			if (sub) return [match, ...sub];
		}
		if (remaining.length === 0) return [match];
	}
	return null;
}

/** Root-to-leaf chain of matches for `pathname` (app-relative), or null. */
export function matchRoutes(routes: readonly RouteDef[], pathname: string): RouteMatch[] | null {
	return walk(routes, splitPath(pathname), {}, []);
}

/** Substitutes `:param` segments (used by `redirect`). */
export function fillParams(path: string, params: Record<string, string>): string {
	return path.replace(/:([A-Za-z0-9_]+)\??/g, (_, name: string) => encodeURIComponent(params[name] ?? ''));
}
