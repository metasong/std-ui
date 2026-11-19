import type { RouteDef, RouteLocation, RouteMatch } from '../types.js';
import { routeContext } from './guards.js';

/** Runs `lazy()` then `load()` for every match in parallel; results keyed by route. */
export async function loadMatches(
	matches: RouteMatch[],
	to: RouteLocation,
	signal: AbortSignal,
): Promise<Map<RouteDef, unknown>> {
	const results = new Map<RouteDef, unknown>();
	await Promise.all(
		matches.map(async (m) => {
			await m.route.lazy?.();
			results.set(m.route, await m.route.load?.(routeContext(to, m, signal)));
		}),
	);
	return results;
}
