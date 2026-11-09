import { describe, expect, it } from 'vitest';
import { consume, createContextKey, state, tag, UIElement } from '../../ui-element.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

interface Theme {
	mode: string;
}

describe('@state({ contextKey }) + @consume()', () => {
	it('a descendant @consume() field reads the ancestor provider\'s current value', () => {
		const ThemeKey = createContextKey<Theme>('theme-basic');

		@tag('ctx-child-basic')
		class Child extends UIElement {
			@consume(ThemeKey) theme!: Theme;
		}

		@tag('ctx-root-basic')
		class Root extends UIElement {
			@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-basic'));
			}
		}

		const root = document.createElement('ctx-root-basic') as Root;
		document.body.appendChild(root);
		const child = root.querySelector('ctx-child-basic') as Child;
		expect(child.theme).toEqual({ mode: 'dark' });
		root.remove();
	});

	it('updates the consumer reactively when the provider field changes', async () => {
		const ThemeKey = createContextKey<Theme>('theme-reactive');
		const rendered: string[] = [];

		@tag('ctx-child-reactive')
		class Child extends UIElement {
			@consume(ThemeKey) theme!: Theme;
			protected override template(): void {
				rendered.push(this.theme.mode);
			}
		}

		@tag('ctx-root-reactive')
		class Root extends UIElement {
			@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-reactive'));
			}
		}

		const root = document.createElement('ctx-root-reactive') as Root;
		document.body.appendChild(root);
		expect(rendered).toEqual(['dark']);

		root.theme.set({ mode: 'light' });
		await flush();
		expect(rendered).toEqual(['dark', 'light']);
		root.remove();
	});

	it('throws if no ancestor provides the context key', () => {
		const OrphanKey = createContextKey<Theme>('theme-orphan');

		@tag('ctx-child-orphan')
		class Orphan extends UIElement {
			@consume(OrphanKey) theme!: Theme;
		}

		// Per the custom-elements spec, an exception thrown from `connectedCallback` is reported
		// (e.g. to `window.onerror`/console), not synchronously propagated to the `appendChild()`
		// call site - so catch it that way instead of wrapping `appendChild()` in `expect().toThrow()`.
		let caught: unknown;
		const onError = (event: ErrorEvent): void => {
			caught = event.error ?? event.message;
			event.preventDefault();
		};
		window.addEventListener('error', onError);
		const el = document.createElement('ctx-child-orphan');
		document.body.appendChild(el);
		window.removeEventListener('error', onError);

		expect(String(caught)).toMatch(/no ancestor/);
		el.remove();
	});

	it('writing a @consume() field throws - it is read-only', () => {
		const ThemeKey = createContextKey<Theme>('theme-readonly');

		@tag('ctx-child-readonly')
		class Child extends UIElement {
			@consume(ThemeKey) theme!: Theme;
		}

		@tag('ctx-root-readonly')
		class Root extends UIElement {
			@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-readonly'));
			}
		}

		const root = document.createElement('ctx-root-readonly') as Root;
		document.body.appendChild(root);
		const child = root.querySelector('ctx-child-readonly') as Child;
		expect(() => {
			child.theme = { mode: 'light' };
		}).toThrow(/read-only/);
		root.remove();
	});

	it('nearest provider wins when a descendant re-provides the same context key', () => {
		const ThemeKey = createContextKey<Theme>('theme-nearest');

		@tag('ctx-grandchild-nearest')
		class Grandchild extends UIElement {
			@consume(ThemeKey) theme!: Theme;
		}

		@tag('ctx-child-nearest')
		class Child extends UIElement {
			@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'light' };
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-grandchild-nearest'));
			}
		}

		@tag('ctx-root-nearest')
		class Root extends UIElement {
			@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-nearest'));
			}
		}

		const root = document.createElement('ctx-root-nearest') as Root;
		document.body.appendChild(root);
		const grandchild = root.querySelector('ctx-grandchild-nearest') as Grandchild;
		expect(grandchild.theme).toEqual({ mode: 'light' }); // nearest (Child), not Root
		root.remove();
	});
});
