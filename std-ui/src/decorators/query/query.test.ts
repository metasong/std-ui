import { describe, expect, it } from 'vitest';
import { query, queryAll, queryAsync, state, tag, UIElement } from '../../ui-element.js';
import { html } from '../../template/html.js';

describe('@query()', () => {
	it('resolves to the matching element, re-querying on every read by default', () => {
		@tag('query-basic')
		class Foo extends UIElement {
			@query('span') span!: HTMLSpanElement | null;
			protected override connect(): void {
				this.innerHTML = '<span>hi</span>';
			}
		}

		const el = document.createElement('query-basic') as Foo;
		document.body.appendChild(el);
		expect(el.span!.textContent).toBe('hi');

		(el.querySelector('span') as HTMLSpanElement).replaceWith(Object.assign(document.createElement('span'), { textContent: 'fresh' }));
		expect(el.span!.textContent).toBe('fresh');
		el.remove();
	});

	it('returns null when nothing matches', () => {
		@tag('query-none')
		class Foo extends UIElement {
			@query('.nope') missing!: HTMLElement | null;
		}

		const el = document.createElement('query-none') as Foo;
		document.body.appendChild(el);
		expect(el.missing).toBeNull();
		el.remove();
	});

	it('caches the first result when `cache: true`, even after the node is replaced', () => {
		@tag('query-cached')
		class Foo extends UIElement {
			@query('span', true) span!: HTMLSpanElement | null;
			protected override connect(): void {
				this.innerHTML = '<span>first</span>';
			}
		}

		const el = document.createElement('query-cached') as Foo;
		document.body.appendChild(el);
		const first = el.span;
		el.innerHTML = '<span>second</span>';
		expect(el.span).toBe(first);
		expect(el.span!.textContent).toBe('first');
		el.remove();
	});

	it('queries nodes inside shadowRoot when shadowRootOptions is set', () => {
		@tag('query-shadow')
		class Foo extends UIElement {
			static override shadowRootOptions = { mode: 'open' } as const;

			@query('.inner') inner!: HTMLElement | null;

			protected override template() {
				return html`<span class="inner">shadow</span>`;
			}
		}

		const el = document.createElement('query-shadow') as Foo;
		document.body.appendChild(el);
		expect(el.querySelector('.inner')).toBeNull();
		expect(el.inner!.textContent).toBe('shadow');
		el.remove();
	});
});

describe('@queryAll()', () => {
	it('resolves to a live-at-read-time NodeList of every match', () => {
		@tag('query-all-basic')
		class Foo extends UIElement {
			@queryAll('li') items!: NodeListOf<HTMLLIElement>;
			protected override connect(): void {
				this.innerHTML = '<ul><li>a</li><li>b</li></ul>';
			}
		}

		const el = document.createElement('query-all-basic') as Foo;
		document.body.appendChild(el);
		expect(Array.from(el.items).map(li => li.textContent)).toEqual(['a', 'b']);

		el.querySelector('ul')!.appendChild(Object.assign(document.createElement('li'), { textContent: 'c' }));
		expect(Array.from(el.items).map(li => li.textContent)).toEqual(['a', 'b', 'c']);
		el.remove();
	});
});

describe('@queryAsync()', () => {
	it('resolves after a pending render catches up with the queried node', async () => {
		@tag('query-async-basic')
		class Foo extends UIElement {
			@state() show = false;
			@queryAsync('.lazy') lazy!: Promise<HTMLElement | null>;
			protected override template() {
				return this.show ? html`<em class="lazy">here</em>` : html``;
			}
		}

		const el = document.createElement('query-async-basic') as Foo;
		document.body.appendChild(el);
		expect(await el.lazy).toBeNull();

		el.show = true;
		const found = await el.lazy;
		expect(found).not.toBeNull();
		expect(found!.textContent).toBe('here');
		el.remove();
	});
});
