import { css, t, tag, state, UIElement } from '@std-ui/core';
import '@std-ui/router'; // defines <std-router>, <std-route>, <std-outlet>
import type { Router, StdRoute, StdRouter } from '@std-ui/router';
import '../shared/demo-nav.js';

const routerOf = (el: Element): Router => (el.closest('std-router') as StdRouter).router;
const flag = (key: string): boolean => localStorage.getItem(key) === '1';

// ---- behaviour that cannot be written as attributes: properties on the <std-route> elements ----

const user = document.getElementById('user-route') as StdRoute;
user.load = async ({ params }) => {
	await new Promise((r) => setTimeout(r, 300)); // simulated fetch
	return { id: params.id, name: `User #${params.id}` };
};

const admin = document.getElementById('admin-route') as StdRoute;
admin.guard = () => (flag('rt-signed-in') ? true : '/users');
admin.load = () => {
	if (flag('rt-fail')) throw new Error('Admin loader failed on purpose');
};

// ---- page elements (plain custom elements; the outlet sets `params`, `data`, `error`) ----

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
		return t`<ul>${[1, 2, 3].map((n) => t`<li><a href="./users/${n}">User ${n}</a></li>`)}</ul>`;
	}
}

@tag('demo-rt-user')
class User extends UIElement {
	data?: { id: string; name: string };
	protected override template() {
		return t`<p>${this.data?.name ?? 'loading…'}</p>`;
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
