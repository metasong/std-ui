declare const process: { env: Record<string, string | undefined> } | undefined;

/**
 * Whether dev-only diagnostics (e.g. undefined custom-element warnings, effect-cycle stack traces)
 * are enabled.
 *
 * Explicit override, highest priority - set before std-ui loads:
 *   globalThis.__STD_UI_DEV__ = true;   // force on  (e.g. debugging a production build)
 *   globalThis.__STD_UI_DEV__ = false;  // force off (e.g. raw-module production page)
 *
 * Otherwise: true unless the consuming bundler marks the build as production. Bundlers
 * statically replace `process.env.NODE_ENV` (Vite, webpack, esbuild `define`, Rollup replace),
 * so dev-only branches get tree-shaken from production builds. Without a bundler `process`
 * is undefined, which counts as dev. Keep the expression literal so bundlers can match it.
 */
export const DEV: boolean =
	(globalThis as { __STD_UI_DEV__?: boolean }).__STD_UI_DEV__ ??
	(typeof process === 'undefined' || process.env.NODE_ENV !== 'production');
