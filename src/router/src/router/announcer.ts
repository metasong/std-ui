import type { RouteLocation, RouteMatch } from '../types.js';

/** Return the text to announce, or null/empty to stay silent. */
export type AnnounceFn = (ctx: { location: RouteLocation; matches: RouteMatch[] }) => string | null | undefined;

export type AnnounceOption = boolean | AnnounceFn;

/** Default message: the deepest route `title`, else the page's first `<h1>`, else the pathname. */
export const defaultAnnounce: AnnounceFn = ({ location, matches }) => {
	const title = [...matches].reverse().find((m) => m.route.title)?.route.title;
	if (title) return title;
	const h1 = document.querySelector('h1')?.textContent?.trim();
	return h1 || location.pathname;
};

/**
 * Visually hidden `aria-live="polite"` region that tells screen readers a client-side navigation
 * happened (the browser announces nothing for same-document navigations that skip a page load).
 */
export class Announcer {
	#region: HTMLElement | null = null;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(private readonly fn: AnnounceFn) {}

	announce(ctx: { location: RouteLocation; matches: RouteMatch[] }): void {
		if (typeof document === 'undefined') return;
		const text = this.fn(ctx);
		if (!text) return;
		const region = this.#ensure();
		// Clear first so an identical message is announced again.
		region.textContent = '';
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => (region.textContent = text), 50);
	}

	dispose(): void {
		clearTimeout(this.#timer);
		this.#region?.remove();
		this.#region = null;
	}

	#ensure(): HTMLElement {
		if (this.#region?.isConnected) return this.#region;
		const el = document.createElement('div');
		el.setAttribute('data-std-announcer', '');
		el.setAttribute('role', 'status');
		el.setAttribute('aria-live', 'polite');
		el.setAttribute('aria-atomic', 'true');
		el.style.cssText =
			'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';
		document.body.append(el);
		return (this.#region = el);
	}
}
