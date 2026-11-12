import { describe, expect, it, vi } from 'vitest';
import { tag, UIElement } from './ui-element.js';
import { signalState } from './signal/signal-state/index.js';
import { t } from './template/html.js';
import { css } from './template/css.js';

interface State {
	count: number;
}

describe('tag() decorator', () => {
	it('registers the class as a custom element under the given tag', () => {
		@tag('el-registers')
		class Foo extends UIElement {}

		expect(customElements.get('el-registers')).toBe(Foo);
	});
});

describe('UIElement', () => {
	it('runs connect() once on first connect, which can inject markup', () => {
		const calls: string[] = [];

		@tag('el-connect')
		class Foo extends UIElement {
			protected override connect(): void {
				calls.push('connect');
				this.innerHTML = '<span>injected</span>';
			}
		}

		const el = document.createElement('el-connect') as Foo;
		document.body.appendChild(el);
		expect(calls).toEqual(['connect']);
		expect(el.querySelector('span')!.textContent).toBe('injected');
		el.remove();
	});

	it('re-runs connect() on every connect, including after a disconnect', () => {
		const connect = vi.fn();

		@tag('el-reconnect')
		class Foo extends UIElement {
			protected override connect = connect;
		}

		const el = document.createElement('el-reconnect') as Foo;
		document.body.appendChild(el);
		el.remove();
		document.body.appendChild(el);
		expect(connect).toHaveBeenCalledTimes(2);
		el.remove();
	});

	it('calls template() immediately on connect and again whenever a signal it reads changes', async () => {
		const tree = signalState<State>({ count: 0 });
		const renderSpy = vi.fn();

		@tag('el-template')
		class Foo extends UIElement {
			protected override template(): void {
				renderSpy(tree.count());
			}
		}

		const el = document.createElement('el-template') as Foo;
		document.body.appendChild(el);
		expect(renderSpy).toHaveBeenCalledTimes(1);
		expect(renderSpy).toHaveBeenLastCalledWith(0);

		tree.count.set(1);
		await flush();
		expect(renderSpy).toHaveBeenLastCalledWith(1);
		el.remove();
	});

	it('renders an t() result returned from template() into the element', () => {
		const tree = signalState<State>({ count: 7 });

		@tag('el-html')
		class Foo extends UIElement {
			protected override template() {
				return t`<em>${tree.count()}</em>`;
			}
		}

		const el = document.createElement('el-html') as Foo;
		document.body.appendChild(el);
		expect(el.querySelector('em')!.textContent).toBe('7');
		el.remove();
	});

	it('calls disconnect() and stops reacting to signals after disconnect', async () => {
		const tree = signalState<State>({ count: 0 });
		const renderSpy = vi.fn();
		const disconnect = vi.fn();

		@tag('el-disconnect')
		class Foo extends UIElement {
			protected override disconnect = disconnect;
			protected override template(): void {
				renderSpy(tree.count());
			}
		}

		const el = document.createElement('el-disconnect') as Foo;
		document.body.appendChild(el);
		el.remove();
		expect(disconnect).toHaveBeenCalledTimes(1);

		renderSpy.mockClear();
		tree.count.set(99);
		await flush();
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('renders template() into a shadow root when shadowRootOptions is set', () => {
		const tree = signalState<State>({ count: 2 });

		@tag('el-shadow')
		class Foo extends UIElement {
			static override shadowRootOptions = { mode: 'open' } as const;

			protected override template() {
				return t`<strong>${tree.count()}</strong>`;
			}
		}

		const el = document.createElement('el-shadow') as Foo;
		document.body.appendChild(el);
		expect(el.shadowRoot).toBeTruthy();
		expect(el.querySelector('strong')).toBeNull();
		expect(el.shadowRoot!.querySelector('strong')!.textContent).toBe('2');
		expect(el.renderRoot).toBe(el.shadowRoot);
		el.remove();
	});

	// `adoptedStyleSheets` isn't supported in jsdom, so these assert via the public effect
	// (`#applyStyles`'s own `Array.isArray` check for support) rather than the exact mechanism -
	// either the sheet lands in `adoptedStyleSheets` (real browsers) or a `<style>` fallback is
	// inserted carrying the same CSS (jsdom and other environments without `adoptedStyleSheets`).

	it('adopts static styles onto the shadow root', () => {
		const styles = css`.el-styled-shadow-marker { display: block; }`;

		@tag('el-styled-shadow')
		class Foo extends UIElement {
			static override shadowRootOptions = { mode: 'open' } as const;
			static override styles = styles;

			protected override template() {
				return t`<span>hi</span>`;
			}
		}

		const el = document.createElement('el-styled-shadow') as Foo;
		document.body.appendChild(el);
		expect(stylesAppliedTo(el.shadowRoot!, styles)).toBe(true);
		el.remove();
	});

	it('flattens an array of static styles, applied in order', () => {
		const a = css`.el-styled-shadow-array-a {}`;
		const b = css`.el-styled-shadow-array-b {}`;

		@tag('el-styled-shadow-array')
		class Foo extends UIElement {
			static override shadowRootOptions = { mode: 'open' } as const;
			static override styles = [a, b];
		}

		const el = document.createElement('el-styled-shadow-array') as Foo;
		document.body.appendChild(el);
		expect(stylesAppliedTo(el.shadowRoot!, a)).toBe(true);
		expect(stylesAppliedTo(el.shadowRoot!, b)).toBe(true);
		el.remove();
	});

	it('adopts static styles onto document, scoped to the tag name, when rendering into light DOM', () => {
		const styles = css`:host { color: red; }`;

		@tag('el-styled-light')
		class Foo extends UIElement {
			static override styles = styles;

			protected override template() {
				return t`<span>hi</span>`;
			}
		}

		const el = document.createElement('el-styled-light') as Foo;
		document.body.appendChild(el);

		// Never inserted into this element's own subtree - no `<style>` child of the host.
		expect(el.querySelector('style')).toBeNull();

		const cssText = documentStylesFor('el-styled-light');
		expect(cssText).toContain('@scope (el-styled-light)');
		// `:host` reads the same way in light DOM as in shadow DOM - rewritten to `:scope` under the `@scope` block.
		expect(cssText).toContain(':scope');
		expect(cssText).not.toContain(':host');
		el.remove();
	});

	it('shares one stylesheet across every instance of a light-DOM class, not one per instance', () => {
		const styles = css`.el-styled-light-shared {}`;

		@tag('el-styled-light-shared')
		class Foo extends UIElement {
			static override styles = styles;
		}

		const a = document.createElement('el-styled-light-shared') as Foo;
		const b = document.createElement('el-styled-light-shared') as Foo;
		document.body.append(a, b);

		expect(occurrencesOfDocumentStyle('el-styled-light-shared')).toBe(1);
		a.remove();
		b.remove();
	});

	it('disposes effect()-registered reactions on disconnect', async () => {
		const tree = signalState<State>({ count: 0 });
		const effectSpy = vi.fn();

		@tag('el-effect')
		class Foo extends UIElement {
			protected override connect(): void {
				this.effect(() => {
					effectSpy(tree.count());
				});
			}
		}

		const el = document.createElement('el-effect') as Foo;
		document.body.appendChild(el);
		expect(effectSpy).toHaveBeenCalledTimes(1);

		el.remove();
		effectSpy.mockClear();
		tree.count.set(5);
		await flush();
		expect(effectSpy).not.toHaveBeenCalled();
	});
});

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

/** Concatenated CSS text of every document-level sheet/`<style>` adopted for `tagName`'s light-DOM `static styles`
 *  (whether via `document.adoptedStyleSheets` or the `<style>` fallback), joined for substring assertions. */
function documentStylesFor(tagName: string): string {
	const adopted = (document as unknown as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets;
	const fromSheets = Array.isArray(adopted)
		? adopted
			.flatMap(sheet => Array.from(sheet.cssRules))
			.filter(rule => rule.cssText.includes(tagName))
			.map(rule => rule.cssText)
		: [];
	const fromStyleTags = Array.from(document.head.querySelectorAll('style'))
		.map(style => style.textContent ?? '')
		.filter(text => text.includes(tagName));
	return [...fromSheets, ...fromStyleTags].join('\n');
}

/** How many separate document-level sheets/`<style>` tags mention `tagName` - used to assert sharing (one per tag,
 *  not one per instance) rather than relying on exact insertion mechanics. */
function occurrencesOfDocumentStyle(tagName: string): number {
	const adopted = (document as unknown as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets;
	const sheetCount = Array.isArray(adopted)
		? adopted.filter(sheet => Array.from(sheet.cssRules).some(rule => rule.cssText.includes(tagName))).length
		: 0;
	const styleTagCount = Array.from(document.head.querySelectorAll('style'))
		.filter(style => style.textContent?.includes(tagName)).length;
	return sheetCount + styleTagCount;
}

/** True if `styles` (a `css` result) landed on `shadowRoot`, whether via `adoptedStyleSheets` or the `<style>` fallback. */
function stylesAppliedTo(shadowRoot: ShadowRoot, styles: ReturnType<typeof css>): boolean {
	const adopted = (shadowRoot as unknown as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets;
	if (Array.isArray(adopted) && adopted.includes(styles.styleSheet)) return true;

	// Fallback `<style>` cssText is re-serialized by the CSSOM, so compare on a stable marker
	// substring (the selector) rather than the exact original literal text.
	const marker = styles.cssText.match(/[.\w-]+/)?.[0] ?? styles.cssText;
	return Array.from(shadowRoot.querySelectorAll('style')).some(style => style.textContent?.includes(marker));
}
