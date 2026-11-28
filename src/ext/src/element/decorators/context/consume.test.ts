import { describe, expect, it } from 'vitest';
import { defineElement, tag, UIElement } from '@std-ui/core';
import { store } from '../../../reactive/store/index.js';
import { consume, createContextKey, defineContext, provide } from './index.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

interface Theme {
	mode: string;
}

describe('@provide(key) + @consume(key)', () => {
	it('a descendant reads the ancestor provider\'s current value as a plain property', () => {
		const ThemeKey = createContextKey<Theme>('theme-basic');

		@tag('ctx-child-basic')
		class Child extends UIElement {
			@consume(ThemeKey) readonly theme!: Theme;
		}

		@tag('ctx-root-basic')
		class Root extends UIElement {
			@provide(ThemeKey) readonly theme = store<Theme>({ mode: 'dark' });
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

	it('is reactive, and read-only on the consumer', async () => {
		const ThemeKey = createContextKey<Theme>('theme-consume-deco');
		const rendered: string[] = [];

		@tag('ctx-child-deco')
		class Child extends UIElement {
			@consume(ThemeKey) readonly theme!: Theme;
			protected override template(): void {
				rendered.push(this.theme.mode);
			}
		}

		@tag('ctx-root-deco')
		class Root extends UIElement {
			@provide(ThemeKey) readonly theme = store<Theme>({ mode: 'dark' });
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-deco'));
			}
		}

		const root = document.createElement('ctx-root-deco') as Root;
		document.body.appendChild(root);
		const child = root.querySelector('ctx-child-deco') as Child;
		expect(() => {
			(child as unknown as { theme: Theme }).theme = { mode: 'x' };
		}).toThrow(TypeError); // getter-only: the provider owns the value
		expect(rendered).toEqual(['dark']);

		root.theme.set({ mode: 'light' });
		await flush();
		expect(rendered).toEqual(['dark', 'light']);
		root.remove();
	});

	it('@consume() rejects a field not typed as the key\'s value', () => {
		const ThemeKey = createContextKey<Theme>('theme-consume-bad');

		class Bad extends UIElement {
			// @ts-expect-error - the field must be `Theme` (the key's value type)
			@consume(ThemeKey) readonly theme!: string;
		}
		void Bad;
	});

	it('a context whose value is itself a function is read once, not this.value()()', () => {
		const FnKey = createContextKey<() => string>('fn-ctx');

		@tag('ctx-child-fn')
		class Child extends UIElement {
			@consume(FnKey) readonly greet!: () => string;
		}

		@tag('ctx-root-fn')
		class Root extends UIElement {
			@provide(FnKey) readonly greet = store<() => string>(() => 'hi');
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-fn'));
			}
		}

		const root = document.createElement('ctx-root-fn') as Root;
		document.body.appendChild(root);
		expect((root.querySelector('ctx-child-fn') as Child).greet()).toBe('hi');
		root.remove();
	});

	it('defineContext({ provide, consume }) is the decorator-free equivalent', async () => {
		const ThemeKey = createContextKey<Theme>('theme-plain');
		const rendered: string[] = [];

		class Child extends UIElement {
			readonly theme!: Theme;
			protected override template(): void {
				rendered.push(this.theme.mode);
			}
		}
		defineContext(Child, { consume: { theme: ThemeKey } });
		defineElement('ctx-child-plain', Child);

		class Root extends UIElement {
			readonly theme = store<Theme>({ mode: 'dark' });
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-plain'));
			}
		}
		defineContext(Root, { provide: { theme: ThemeKey } });
		defineElement('ctx-root-plain', Root);

		const root = document.createElement('ctx-root-plain') as Root;
		document.body.appendChild(root);
		const child = root.querySelector('ctx-child-plain') as Child;
		expect(child.theme).toEqual({ mode: 'dark' });

		root.theme.set({ mode: 'light' });
		await flush(); // provider effects are microtask-batched
		expect(child.theme).toEqual({ mode: 'light' });
		expect(rendered).toEqual(['dark', 'light']);
		root.remove();
	});

	it('defineContext rejects a consume key whose value type does not match the field', () => {
		const ThemeKey = createContextKey<Theme>('theme-plain-bad');

		class Child extends UIElement {
			readonly label = 'x';
		}
		// @ts-expect-error - `label` is a string, the key carries a `Theme`
		void (() => defineContext(Child, { consume: { label: ThemeKey } }));
	});

	it('throws if no ancestor provides the context key', () => {
		const OrphanKey = createContextKey<Theme>('theme-orphan');

		@tag('ctx-child-orphan')
		class Orphan extends UIElement {
			@consume(OrphanKey) readonly theme!: Theme;
		}
		void Orphan;

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

	it('nearest provider wins when a descendant re-provides the same context key', () => {
		const ThemeKey = createContextKey<Theme>('theme-nearest');

		@tag('ctx-grandchild-nearest')
		class Grandchild extends UIElement {
			@consume(ThemeKey) readonly theme!: Theme;
		}

		@tag('ctx-child-nearest')
		class Child extends UIElement {
			@provide(ThemeKey) readonly theme = store<Theme>({ mode: 'light' });
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-grandchild-nearest'));
			}
		}

		@tag('ctx-root-nearest')
		class Root extends UIElement {
			@provide(ThemeKey) readonly theme = store<Theme>({ mode: 'dark' });
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

	it('inherits provide/consume defs from a base class', () => {
		const ThemeKey = createContextKey<Theme>('theme-inherit');

		class BaseChild extends UIElement {
			@consume(ThemeKey) readonly theme!: Theme;
		}
		@tag('ctx-child-inherit')
		class Child extends BaseChild {}

		@tag('ctx-root-inherit')
		class Root extends UIElement {
			@provide(ThemeKey) readonly theme = store<Theme>({ mode: 'dark' });
			protected override connect(): void {
				this.appendChild(document.createElement('ctx-child-inherit'));
			}
		}

		const root = document.createElement('ctx-root-inherit') as Root;
		document.body.appendChild(root);
		expect((root.querySelector('ctx-child-inherit') as Child).theme).toEqual({ mode: 'dark' });
		root.remove();
	});
});
