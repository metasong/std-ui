import type { NavigateEventLike } from '../navigation/types.js';
import type { RouteLocation, RouteMatch } from '../types.js';
import { abortError } from './abort.js';
import type { Verdict } from './guards.js';

const MAX_REDIRECTS = 10;

export interface InterceptDeps {
	check(to: RouteLocation, signal: AbortSignal, leaving: boolean, isStale: () => boolean): Promise<Verdict | null>;
	/** App-relative path to full URL (adds `base`). */
	href(path: string): string;
	/** Post-commit phase: load data and publish state for `approved` matches. */
	resolve(to: RouteLocation, approved: RouteMatch[], signal: AbortSignal): Promise<void>;
}

/**
 * Intercepts `e` so guards run in `precommitHandler` (before the URL commits): a block cancels the
 * navigation, a redirect uses `controller.redirect()` and re-checks the target, then `handler` publishes.
 */
export function interceptWithGuards(
	e: NavigateEventLike,
	to: RouteLocation,
	leaving: boolean,
	deps: InterceptDeps,
): void {
	let target = to;
	let approved: RouteMatch[] = [];
	e.intercept({
		precommitHandler: async (controller) => {
			const stale = (): boolean => e.signal.aborted;
			let verdict = await deps.check(target, e.signal, leaving, stale);
			for (let hops = 0; verdict?.kind === 'redirect'; hops++) {
				if (hops >= MAX_REDIRECTS) throw new Error('Too many redirects');
				const u = new URL(verdict.path, 'http://router.local');
				target = { pathname: u.pathname, search: u.search, hash: u.hash, state: to.state };
				controller.redirect(deps.href(verdict.path), { history: 'replace', state: to.state });
				// Leave hooks already ran for the original navigation.
				verdict = await deps.check(target, e.signal, false, stale);
			}
			if (!verdict || verdict.kind === 'block') throw abortError();
			approved = verdict.matches;
		},
		handler: () => deps.resolve(target, approved, e.signal),
	});
}
