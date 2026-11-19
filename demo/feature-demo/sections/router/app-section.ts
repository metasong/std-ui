import { css, t, tag, state, UIElement } from '@std-ui/core';
import { routeParam, searchParam } from '@std-ui/router';
import '@std-ui/router'; // defines <std-router>, <std-route>, <std-outlet>
import type { Router, StdRouter } from '@std-ui/router';

const routerOf = (el: Element): Router => (el.closest('std-router') as StdRouter).router;
const flag = (key: string): boolean => localStorage.getItem(key) === '1';

// ---- page elements (plain custom elements; the outlet sets `params`, `data`, `error`) ----

// Light DOM: the rules are wrapped in `@scope (demo-router-full-section)`, so they cover this markup
// and the route elements rendered into the outlet.
const appStyles = css`
	.rt-links { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 1rem; }
	.rt-links a { padding: 0.35rem 0.75rem; border-radius: 999px; text-decoration: none; color: var(--md-sys-color-primary, #6750a4); border: 1px solid var(--md-sys-color-outline-variant, #cac4d0); }
	.rt-links a[aria-current='page'] { background: var(--md-sys-color-secondary-container, #e8def8); }
	.rt-panel { border: 1px solid var(--md-sys-color-outline-variant, #cac4d0); border-radius: 12px; padding: 1rem; margin-block: 1rem; }
	.rt-status { font: 400 0.8rem/1.4 'Roboto Mono', monospace; color: var(--md-sys-color-on-surface-variant, #49454f); }
	/* View transition: slide the page content. */
	std-outlet { view-transition-name: rt-page; }
`;

// View-transition pseudo-elements hang off `:root`, outside any element scope, so they live on `document`.
const transitionStyles = css`
	::view-transition-old(rt-page) { animation: rt-out 150ms ease-in both; }
	::view-transition-new(rt-page) { animation: rt-in 200ms ease-out both; }
	@keyframes rt-out { to { opacity: 0; transform: translateY(-8px); } }
	@keyframes rt-in { from { opacity: 0; transform: translateY(8px); } }
`;

const loadUser = async ({ params }: { params: Record<string, string> }) => {
	await new Promise((r) => setTimeout(r, 300)); // simulated fetch
	return { id: params.id, name: `User #${params.id}` };
};
const guardAdmin = () => (flag('rt-signed-in') ? true : '/users');
const loadAdmin = () => {
	if (flag('rt-fail')) throw new Error('Admin loader failed on purpose');
};

@tag('demo-router-full-section')
export class DemoRouterFullSection extends UIElement {
	static override styles = appStyles;
	#observer?: MutationObserver;

	protected override connect(): void {
		const sheet = transitionStyles.styleSheet;
		if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
		// The announcer's live region is visually hidden; mirror it so the demo shows what a screen reader hears.
		this.#observer = new MutationObserver(() => {
			const announced = this.querySelector('#rt-announced');
			const text = document.querySelector('[data-std-announcer]')?.textContent;
			// Only write on change: this observer watches `document.body`, which contains `announced` itself.
			if (announced && text && announced.textContent !== text) announced.textContent = text;
		});
		this.#observer.observe(document.body, { childList: true, subtree: true, characterData: true });
	}

	protected override disconnect(): void {
		this.#observer?.disconnect();
		document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== transitionStyles.styleSheet);
	}

	protected override template() {
		return t`
			<section class="demo-router-block" id="full-router">
				<h2>Full router</h2>
				<p class="desc">
					Navigation API router with <code>&lt;std-route&gt;</code> markup: nested routes, a lazy-style loader, a guard,
					redirects, and a <code>beforeLeave</code> / tab-close guard. Uses real URLs under <code>/feature-demo/router/</code>
					(dev server only).
				</p>
				<std-router base="/feature-demo/router" view-transition>
					<nav class="rt-links">
						<a href="/feature-demo/router/">Home</a>
						<a href="/feature-demo/router/users">Users</a>
						<a href="/feature-demo/router/users/3">User 3</a>
						<a href="/feature-demo/router/editor">Editor (unsaved guard)</a>
						<a href="/feature-demo/router/admin">Admin (guarded)</a>
						<a href="/feature-demo/router/old-users">Old URL (redirect)</a>
						<a href="/feature-demo/router/nowhere">Nowhere (404)</a>
					</nav>

					<demo-rt-controls></demo-rt-controls>
					<demo-rt-status></demo-rt-status>
					<p class="rt-status">announced to screen readers: <output id="rt-announced">(navigate to see)</output></p>

					<std-route path="/" title="Home - router demo">
						<template><div class="rt-panel"><h2>Home</h2><p>Plain inline <code>&lt;template&gt;</code> route.</p></div></template>
					</std-route>
					<std-route path="/users" element="demo-rt-layout" title="Users - router demo">
						<std-route index element="demo-rt-users"></std-route>
						<std-route path=":id" element="demo-rt-user" .load=${loadUser}></std-route>
					</std-route>
					<std-route path="/editor" element="demo-rt-editor" title="Editor - router demo"></std-route>
					<std-route path="/admin" element="demo-rt-admin" error-element="demo-rt-error" .guard=${guardAdmin} .load=${loadAdmin}></std-route>
					<std-route path="/old-users" redirect="/users"></std-route>
					<std-route path="*">
						<template><div class="rt-panel"><h2>404</h2><p>No route matches.</p></div></template>
					</std-route>

					<std-outlet></std-outlet>
				</std-router>
			</section>
		`;
	}
}
@tag('demo-rt-controls')
class Controls extends UIElement {
	private readonly signedIn = state(flag('rt-signed-in'));
	private readonly fail = state(flag('rt-fail'));

	private toggle(key: string, s: typeof this.signedIn): void {
		s.set(!s.peek());
		localStorage.setItem(key, s.peek() ? '1' : '0');
	}

	protected override template() {
		return t`<p>
			<label><input type="checkbox" .checked=${this.signedIn()} @change=${() => this.toggle('rt-signed-in', this.signedIn)} /> signed in (admin guard)</label>
			<label><input type="checkbox" .checked=${this.fail()} @change=${() => this.toggle('rt-fail', this.fail)} /> admin loader throws</label>
		</p>`;
	}
}

@tag('demo-rt-status')
class Status extends UIElement {
	protected override template() {
		const router = routerOf(this);
		return t`<p class="rt-status">
			path=${router.location().pathname} · status=${router.status()} · matches=${router.matches().length}
			· params=${JSON.stringify(router.params())}
		</p>`;
	}
}

@tag('demo-rt-layout')
class Layout extends UIElement {
	protected override template() {
		return t`<div class="rt-panel"><h2>Users layout</h2><std-outlet></std-outlet></div>`;
	}
}

@tag('demo-rt-users')
class Users extends UIElement {
	protected override template() {
		return t`<ul>${[1, 2, 3].map((n) => t`<li><a href="/feature-demo/router/users/${n}">User ${n}</a></li>`)}</ul>`;
	}
}

@tag('demo-rt-user')
class User extends UIElement {
	data?: { id: string; name: string };
	@routeParam('id') readonly userId?: string; // `:id` of the route, reactive
	@searchParam('tab') readonly tab?: string; // `?tab=...`, reactive
	protected override template() {
		return t`<p>${this.data?.name ?? 'loading…'}</p>
			<p>id=${this.userId} · tab=${this.tab ?? '(none)'}
				· <a href="/feature-demo/router/users/${this.userId}?tab=posts">posts</a> <a href="/feature-demo/router/users/${this.userId}?tab=likes">likes</a></p>`;
	}
}

@tag('demo-rt-editor')
class Editor extends UIElement {
	static override styles = css`textarea { width: 100%; box-sizing: border-box; }`;
	private readonly text = state('');
	private saved = '';
	#off?: () => void;

	protected override connect(): void {
		const dirty = (): boolean => this.text.peek() !== this.saved;
		// The second argument also prompts on tab close / reload while there is unsaved text.
		this.#off = routerOf(this).beforeLeave(() => !dirty() || confirm('Discard unsaved changes?'), { unload: dirty });
	}

	protected override disconnect(): void {
		this.#off?.();
	}

	protected override template() {
		return t`<div class="rt-panel">
			<h2>Editor</h2>
			<textarea rows="4" .value=${this.text()} @input=${(e: Event) => this.text.set((e.target as HTMLTextAreaElement).value)}></textarea>
			<button @click=${() => (this.saved = this.text.peek())}>Save</button>
			<p>Type, then navigate away or reload: you are asked first.</p>
		</div>`;
	}
}

@tag('demo-rt-admin')
class Admin extends UIElement {
	protected override template() {
		return t`<div class="rt-panel"><h2>Admin</h2><p>Signed in.</p></div>`;
	}
}

@tag('demo-rt-error')
class ErrorPage extends UIElement {
	error?: Error;
	protected override template() {
		return t`<div class="rt-panel"><h2>Something failed</h2><p>${this.error?.message ?? ''}</p></div>`;
	}
}
