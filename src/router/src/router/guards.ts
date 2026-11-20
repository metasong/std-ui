import { fillParams, matchRoutes } from '../match/matcher.js';
import type { RouteContext, RouteDef, RouteLocation, RouteMatch } from '../types.js';
import type { LeaveHooks } from './leave-hooks.js';

export type Verdict =
	| { kind: 'ok'; matches: RouteMatch[] }
	| { kind: 'block' }
	| { kind: 'redirect'; path: string };

export function routeContext(to: RouteLocation, m: RouteMatch, signal: AbortSignal): RouteContext {
	return { location: to, params: m.params, search: new URLSearchParams(to.search), signal, route: m.route };
}

export interface CheckInput {
	routes: readonly RouteDef[];
	leave: LeaveHooks;
	from: RouteLocation;
	to: RouteLocation;
	signal: AbortSignal;
	/** Run `beforeLeave` hooks (false for redirect targets and re-resolves). */
	leaving: boolean;
	isStale: () => boolean;
}

/** Redirect attributes, `beforeLeave` hooks, then route guards. Null when superseded. */
export async function checkNavigation(input: CheckInput): Promise<Verdict | null> {
	const { routes, leave, from, to, signal, leaving, isStale } = input;
	const matches = matchRoutes(routes, to.pathname) ?? [];

	// Leave hooks first: they guard leaving the current page, whatever the target turns out to be.
	if (leaving) {
		const result = await leave.run({ from, to, signal }, isStale);
		if (result === 'stale') return null;
		if (result === 'block') return { kind: 'block' };
	}
	for (const m of matches) {
		if (m.route.redirect !== undefined) return { kind: 'redirect', path: fillParams(m.route.redirect, m.params) };
	}
	for (const m of matches) {
		const verdict = await m.route.guard?.(routeContext(to, m, signal));
		if (isStale()) return null;
		if (typeof verdict === 'string') return { kind: 'redirect', path: verdict };
		if (verdict === false) return { kind: 'block' };
	}
	return { kind: 'ok', matches };
}
