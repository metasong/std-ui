import { matchRoutes } from '../match/matcher.js';
import type { RouteDef, RouteLocation, RouteMatch } from '../types.js';
import { checkNavigation } from './guards.js';
import type { LeaveHooks } from './leave-hooks.js';

const MAX_REDIRECTS = 10;

/**
 * Outcome of the Plan step. `to` differs from the requested location when redirects were followed.
 * `error` is set when a redirect limit, `beforeLeave` hook or guard threw: the navigation still
 * goes ahead (matches are whatever `to` resolves to) so `errorElement` can render.
 */
export type Plan = { kind: 'go'; to: RouteLocation; matches: RouteMatch[]; error?: unknown } | { kind: 'block' };
export type GoPlan = Extract<Plan, { kind: 'go' }>;

/** Marks navigations the router started itself, so `beforeLeave` hooks do not run twice. */
export const REDIRECT_INFO = { stdUiRedirect: true } as const;
export const isRedirect = (info: unknown): boolean => (info as { stdUiRedirect?: boolean } | null)?.stdUiRedirect === true;

export interface PlanInput {
	routes: readonly RouteDef[];
	leave: LeaveHooks;
	from: RouteLocation;
	to: RouteLocation;
	/** Run `beforeLeave` hooks (not for redirect navigations or re-resolves). */
	leaving: boolean;
	signal: AbortSignal;
	isStale: () => boolean;
}

/** May this navigation happen, and where does it end? Null when superseded. */
export async function planNavigation(input: PlanInput): Promise<Plan | null> {
	let to = input.to;
	let leaving = input.leaving;
	try {
		for (let hops = 0; hops <= MAX_REDIRECTS; hops++) {
			const verdict = await checkNavigation({ ...input, to, leaving });
			if (!verdict) return null;
			if (verdict.kind === 'block') return verdict;
			if (verdict.kind === 'ok') return { kind: 'go', to, matches: verdict.matches };
			to = locationFromPath(verdict.path, to.state);
			leaving = false; // hooks already ran for the original navigation
		}
		// Keep the requested location: a loop has no meaningful "last hop" to land on.
		to = input.to;
		throw new Error('Too many redirects');
	} catch (error) {
		if (input.isStale()) return null;
		return { kind: 'go', to, matches: matchRoutes(input.routes, to.pathname) ?? [], error };
	}
}

export function locationFromPath(path: string, state: unknown): RouteLocation {
	const u = new URL(path, 'http://router.local');
	return { pathname: u.pathname, search: u.search, hash: u.hash, state };
}
