import { describe, expect, it } from 'vitest';
import { query, queryAll, queryAsync, queryElement, queryElementAsync, queryElements, tag, UIElement } from '../../ui-element.js';
import { t } from '../../template/tag-funcs/html/index.js';
import { stateTree } from '../../../reactive/index.js';

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
				return t`<span class="inner">shadow</span>`;
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
			readonly show = stateTree(false);
			@queryAsync('.lazy') lazy!: Promise<HTMLElement | null>;
			protected override template() {
				return this.show() ? t`<em class="lazy">here</em>` : t``;
			}
		}

		const el = document.createElement('query-async-basic') as Foo;
		document.body.appendChild(el);
		expect(await el.lazy).toBeNull();

		el.show.set(true);
		const found = await el.lazy;
		expect(found).not.toBeNull();
		expect(found!.textContent).toBe('here');
		el.remove();
	});
});

describe('cached queries never keep a miss', () => {
	it('re-queries after a null result, then keeps the first successful one (decorator and function)', async () => {
		@tag('query-cache-miss')
		class Foo extends UIElement {
			readonly show = stateTree(false);
			@query('.late', true) late!: HTMLElement | null;
			get lateFn() { return queryElement(this, '.late', true); }
			protected override template() {
				return t`${this.show() ? t`<p class="late">x</p>` : ''}`;
			}
		}

		const el = document.createElement('query-cache-miss') as Foo;
		document.body.appendChild(el);
		expect(el.late).toBeNull();
		expect(el.lateFn).toBeNull();

		el.show.set(true);
		await el.updateComplete;
		const found = el.late;
		expect(found).not.toBeNull(); // the earlier miss was not cached
		expect(el.lateFn).not.toBeNull();

		el.show.set(false);
		await el.updateComplete;
		expect(el.late).toBe(found); // a successful result is kept, even if the node is gone
		el.remove();
	});
});

describe('queryElement() & co. (decorator-free)', () => {
	it('behind class getters they read like the @query() properties (el.span, not el.span())', async () => {
		@tag('query-methods')
		class Foo extends UIElement {
			readonly show = stateTree(false);
			get span() { return queryElement<HTMLSpanElement>(this, 'span'); }
			get items() { return queryElements(this, 'li'); }
			get lazy() { return queryElementAsync(this, '.lazy'); }
			get cached() { return queryElement(this, 'span', true); }
			protected override template() {
				return t`<span>hi</span><ul><li>a</li><li>b</li></ul>${this.show() ? t`<p class="lazy">here</p>` : ''}`;
			}
		}

		const el = document.createElement('query-methods') as Foo;
		document.body.appendChild(el);
		expect(el.span!.textContent).toBe('hi');
		expect(el.items.length).toBe(2);
		expect(await el.lazy).toBeNull();

		const first = el.cached;
		el.querySelector('span')!.replaceWith(document.createElement('span'));
		expect(el.cached).toBe(first); // cached: the original node, even though it was replaced
		expect(el.span).not.toBe(first); // uncached: re-queried

		el.show.set(true);
		expect((await el.lazy)!.textContent).toBe('here');
		el.remove();
	});
});