declare const process: { env: Record<string, string | undefined> } | undefined;

// Same switch as `@std-ui/core`'s DEV flag (not part of its public API): `globalThis.__STD_UI_DEV__`
// overrides, otherwise on unless the bundler marks the build as production.
export const DEV: boolean =
	(globalThis as { __STD_UI_DEV__?: boolean }).__STD_UI_DEV__ ??
	(typeof process === 'undefined' || process.env.NODE_ENV !== 'production');

const warned = new Set<string>();

/** DEV only: nothing matched, which renders an empty outlet. Usually a missing route or `base` mismatch. */
export function warnNotFound(pathname: string): void {
	if (!DEV || warned.has(pathname)) return;
	warned.add(pathname);
	console.warn(
		`@std-ui/router: no route matches "${pathname}". Add a route for it, or a catch-all (path="*") to handle not-found.`,
	);
}
