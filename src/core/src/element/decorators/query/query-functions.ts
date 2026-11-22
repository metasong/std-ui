// Decorator-free DOM queries: plain functions that take the host element as their first argument.
// They run the query *when called* and return the result itself - exactly what reading the matching
// decorated property returns (`@query()`, `@queryAll()`, `@queryAsync()`).
//
// Prefer the decorators where you can use them (`@query('#input') input!: HTMLInputElement | null`):
// they read as plain properties and need no boilerplate. These functions are for builds without
// decorator support. A field initializer runs once, so it can't hold a live value; for
// property-style access wrap the call in a class getter:
//
//   get input() { return queryElement<HTMLInputElement>(this, '#input'); }   // el.input

import type { UIElement } from '../../ui-element.js';

/** Cached `queryElement(host, selector, true)` results, per host and selector. */
const cache = new WeakMap<UIElement, Map<string, Element>>();

/**
 * The first element matching `selector` in `host.renderRoot` (or `null`) - what a `@query(selector)`
 * property returns. With `cached: true`, the first *successful* result for this host and selector is
 * kept (safe only for a node that's never replaced); a `null` miss is never cached.
 */
export function queryElement<T extends Element = HTMLElement>(host: UIElement, selector: string, cached = false): T | null {
	if (!cached) return host.renderRoot.querySelector<T>(selector);
	const hit = cache.get(host)?.get(selector) as T | undefined;
	if (hit) return hit;
	const found = host.renderRoot.querySelector<T>(selector);
	if (found) { // only a successful query is kept; a miss is re-queried next time
		let results = cache.get(host);
		if (!results) cache.set(host, (results = new Map()));
		results.set(selector, found);
	}
	return found;
}

/** Every element matching `selector` in `host.renderRoot` (a fresh `NodeList`) - what a `@queryAll()` property returns. */
export function queryElements<T extends Element = HTMLElement>(host: UIElement, selector: string): NodeListOf<T> {
	return host.renderRoot.querySelectorAll<T>(selector);
}

/** A `Promise` of the first match, resolved after pending renders flush - what a `@queryAsync()` property returns. */
export function queryElementAsync<T extends Element = HTMLElement>(host: UIElement, selector: string): Promise<T | null> {
	return host.updateComplete.then(() => host.renderRoot.querySelector<T>(selector));
}

