// Minimal structural subset of the Navigation API. Declared here (not taken from lib.dom) so the
// router depends only on what it uses, and so tests can supply `createMemoryNavigation()`.

export interface NavigationEntryLike {
	readonly key: string;
	readonly url: string | null;
	getState(): unknown;
}

export interface NavigateEventLike extends Event {
	readonly canIntercept: boolean;
	readonly hashChange: boolean;
	readonly downloadRequest: string | null;
	readonly formData: FormData | null;
	readonly navigationType: 'push' | 'replace' | 'reload' | 'traverse';
	readonly destination: { readonly url: string; getState(): unknown };
	readonly signal: AbortSignal;
	intercept(options?: { handler?: () => Promise<void> | void }): void;
}

export interface NavigationResultLike {
	committed: Promise<unknown>;
	finished: Promise<unknown>;
}

export interface NavigationLike extends EventTarget {
	readonly currentEntry: NavigationEntryLike | null;
	navigate(url: string, options?: { history?: 'auto' | 'push' | 'replace'; state?: unknown }): NavigationResultLike;
	back(): NavigationResultLike;
	forward(): NavigationResultLike;
	traverseTo(key: string): NavigationResultLike;
}
