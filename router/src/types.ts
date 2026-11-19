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
