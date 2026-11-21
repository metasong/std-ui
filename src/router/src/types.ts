export interface RouteLocation {
	/** App-relative: `base` already stripped. */
	pathname: string;
	search: string;
	hash: string;
	state: unknown;
}

export interface RouteContext {
	location: RouteLocation;
	/** Params accumulated from the root route down to this one. */
	params: Record<string, string>;
	search: URLSearchParams;
	/** Aborted when a newer navigation supersedes this one. */
	signal: AbortSignal;
	/** The matched route being processed. */
	route: RouteDef;
}

/** `true`/`undefined` allow, `false` blocks, a string redirects (app-relative). */
export type GuardResult = boolean | string | void;

export interface LeaveContext {
	from: RouteLocation;
	to: RouteLocation;
	signal: AbortSignal;
}

/** `false` blocks the navigation; anything else lets it proceed. */
export type BeforeLeaveHook = (ctx: LeaveContext) => boolean | void | Promise<boolean | void>;

export interface BeforeLeaveOptions {
	/**
	 * Synchronous "is there unsaved work?" check. While the router is started and any registered
	 * hook returns true here, closing or reloading the tab shows the browser's leave prompt.
	 * Separate from the hook because `beforeunload` cannot await or show custom UI.
	 */
	unload?: () => boolean;
}

export interface RouteDef {
	/** Relative to the parent route. Syntax: `users`, `:id`, `:id?`, `*`. Omit with `index`. */
	path?: string;
	/** Matches the parent's path exactly. */
	index?: boolean;
	/** Custom element tag rendered by the outlet. */
	element?: string;
	/** Static content rendered when there is no `element`. */
	template?: HTMLTemplateElement;
	/** Awaited before commit, e.g. a dynamic `import()` that defines `element`. */
	lazy?: () => Promise<unknown>;
	load?: (ctx: RouteContext) => unknown;
	guard?: (ctx: RouteContext) => GuardResult | Promise<GuardResult>;
	/** App-relative target; `:param` segments are substituted. */
	redirect?: string;
	/** Tag rendered instead of `element` when navigation fails. */
	errorElement?: string;
	/**
	 * Keep the rendered `element` instance when navigating away (detached from the DOM, so `disconnect()` runs) and
	 * re-attach it, with refreshed `params`/`data`, when the route matches again in the same outlet. Not applied to
	 * `errorElement` or `template` routes.
	 */
	keepAlive?: boolean;
	title?: string;
	meta?: Record<string, unknown>;
	children?: RouteDef[];
}

export interface RouteMatch {
	route: RouteDef;
	/** Accumulated params up to and including this route. */
	params: Record<string, string>;
	/** Path portion consumed through this route. */
	pathname: string;
}

export type RouterStatus = 'idle' | 'loading' | 'error';

export interface NavigateOptions {
	replace?: boolean;
	state?: unknown;
}
