import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html } from '../../html.js';
import { AttributePart, ChildPart } from '../../parts/index.js';
import { virtualize } from './core.js';
import { VirtualizeController } from './controller.js';
import { computeWindow, RowModel, scrollTarget, spacerHeight } from './layout.js';

describe('layout math', () => {
	const model = (est: number, gap: number, rows: number) => {
		const m = new RowModel(est, gap);
		m.configure(est, gap, rows);
		return m;
	};

	it('computes total height with gaps', () => {
		expect(model(10, 2, 100).total()).toBe(100 * 12 - 2);
		expect(model(10, 0, 0).total()).toBe(0);
	});

	it('windows rows with overscan, clamped', () => {
		const m = model(10, 0, 100);
		expect(computeWindow(m, 100, 1, 0, 50, 0)).toMatchObject({ start: 0, end: 5 });
		expect(computeWindow(m, 100, 1, 500, 50, 2)).toMatchObject({ start: 48, end: 57 });
		expect(computeWindow(m, 100, 1, 10_000, 50, 2)).toMatchObject({ end: 100 });
	});

	it('windows whole rows in a grid', () => {
		const m = model(10, 0, 4); // 10 items, 3 columns
		expect(computeWindow(m, 10, 3, 10, 5, 0)).toMatchObject({ start: 3, end: 6, startRow: 1, endRow: 2 });
		expect(computeWindow(m, 10, 3, 1000, 10, 0).end).toBe(10); // last partial row
	});

	it('spacer accounts for the gap that separates it from its neighbour', () => {
		const m = model(10, 4, 10);
		expect(spacerHeight(m, 0, 3)).toBe(3 * 14 - 4);
		expect(spacerHeight(m, 3, 3)).toBe(0);
	});

	it('uses measured heights for offsets and lookup', () => {
		const m = model(10, 0, 5);
		expect(m.setHeight(1, 30)).toBe(true);
		expect(m.setHeight(1, 30)).toBe(false);
		expect(m.offset(2)).toBe(40);
		expect(m.total()).toBe(10 + 30 + 30);
		expect(m.rowAt(39)).toBe(1);
		expect(m.rowAt(40)).toBe(2);
		expect(m.rowAt(9999)).toBe(4);
	});

	it('scrollTarget aligns', () => {
		const m = model(10, 0, 100);
		expect(scrollTarget(m, 100, 1, 20, 'start', 0, 50)).toBe(200);
		expect(scrollTarget(m, 100, 1, 20, 'end', 0, 50)).toBe(160);
		expect(scrollTarget(m, 100, 1, 20, 'center', 0, 50)).toBe(180);
		expect(scrollTarget(m, 100, 1, 20, 'nearest', 190, 50)).toBe(190);
		expect(scrollTarget(m, 100, 1, 20, 'nearest', 300, 50)).toBe(200);
		expect(scrollTarget(model(10, 0, 25), 100, 4, 9, 'start', 0, 50)).toBe(20); // row 2
	});
});
describe('virtualize', () => {
	const ITEM = 10;
	let scroller: HTMLElement;
	let list: HTMLElement;
	let part: ChildPart;
	let scrollTop = 0;
	let rowHeight: (row: number) => number = () => ITEM;

	beforeEach(() => {
		scrollTop = 0;
		rowHeight = () => ITEM;
		scroller = document.createElement('div');
		scroller.style.overflowY = 'auto';
		Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true });
		Object.defineProperty(scroller, 'scrollTop', {
			get: () => scrollTop,
			set: (v: number) => void (scrollTop = v),
			configurable: true,
		});
		list = document.createElement('div');
		scroller.appendChild(list);
		document.body.appendChild(scroller);
		const anchor = document.createComment('std-ui-part');
		list.appendChild(anchor);
		part = new ChildPart(anchor);

		// Emulate layout: item i sits at row offset minus scroll; the scroller sits at 0.
		vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			const i = (this as HTMLElement).dataset?.i;
			const cols = Number((this as HTMLElement).dataset?.cols ?? 1);
			let top = 0;
			let height = 0;
			if (i !== undefined) {
				const row = Math.floor(Number(i) / cols);
				const topSpacer = list.querySelector<HTMLElement>('[data-std-ui-spacer]')!;
				const spacerH = topSpacer.style.display === 'none' ? 0 : parseFloat(topSpacer.style.height);
				const firstRow = Math.floor(Number(list.querySelector<HTMLElement>('[data-i]')!.dataset.i) / cols);
				top = spacerH - scrollTop;
				for (let r = firstRow; r < row; r++) top += rowHeight(r);
				height = rowHeight(row);
			}
			return { top, bottom: top + height, left: 0, right: 0, width: 0, height, x: 0, y: top, toJSON() {} };
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		scroller.remove();
	});

	const data = Array.from({ length: 1000 }, (_, i) => ({ id: `k${i}`, i }));
	const rendered = () => [...list.querySelectorAll<HTMLElement>('[data-i]')].map((e) => Number(e.dataset.i));
	const spacers = () => [...list.querySelectorAll<HTMLElement>('[data-std-ui-spacer]')];
	const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

	function mount(extra: Record<string, unknown> = {}) {
		const renderItem = vi.fn((d: { i: number }) => html`<div data-i="${String(d.i)}" data-cols="${String(extra.columns ?? 1)}">${d.i}</div>`);
		part.update([virtualize(data, { itemHeight: ITEM, overscan: 1, renderItem, ...extra })]);
		return renderItem;
	}

	it('throws outside a child position and on bad itemHeight', () => {
		const attr = new AttributePart(document.createElement('div'), 'title');
		expect(() => attr.update([virtualize([], { itemHeight: 1, renderItem: () => '' })])).toThrow(/child position/);
		expect(() => part.update([virtualize([], { itemHeight: 0, renderItem: () => '' })])).toThrow(/itemHeight/);
	});

	it('renders only the window and sizes the spacers', () => {
		const render = mount();
		const idx = rendered();
		expect(idx[0]).toBe(0);
		expect(idx.length).toBe(11); // 10 visible rows + 1 overscan
		expect(render).toHaveBeenCalledTimes(11);
		const [top, bottom] = spacers();
		expect(top.style.display).toBe('none');
		expect(bottom.style.height).toBe(`${(1000 - 11) * ITEM}px`);
	});

	it('slides the window on scroll without re-rendering existing rows', async () => {
		const render = mount();
		const firstEl = list.querySelector('[data-i="5"]');
		render.mockClear();
		scrollTop = 500;
		scroller.dispatchEvent(new Event('scroll'));
		await frame();
		const idx = rendered();
		expect(idx[0]).toBe(49);
		expect(idx[idx.length - 1]).toBe(60);
		expect(list.contains(firstEl)).toBe(false);
		expect(render).toHaveBeenCalledTimes(idx.length); // only new rows rendered
		expect(spacers()[0].style.height).toBe(`${49 * ITEM}px`);
	});

	it('keeps DOM for rows that stay in the window', async () => {
		mount();
		scrollTop = 20;
		scroller.dispatchEvent(new Event('scroll'));
		await frame();
		const el = list.querySelector('[data-i="5"]');
		scrollTop = 30;
		scroller.dispatchEvent(new Event('scroll'));
		await frame();
		expect(list.querySelector('[data-i="5"]')).toBe(el);
	});

	it('re-renders windowed items when the parent re-renders', () => {
		const render = mount();
		render.mockClear();
		part.update([virtualize(data, { itemHeight: ITEM, overscan: 1, renderItem: render })]);
		expect(render).toHaveBeenCalledTimes(11);
	});

	it('scrollToIndex moves the window synchronously', () => {
		const controller = new VirtualizeController();
		mount({ controller });
		controller.scrollToIndex(300);
		expect(scrollTop).toBe(300 * ITEM);
		expect(rendered()).toContain(300);
		expect(rendered()).not.toContain(0);
		controller.scrollToIndex(300, { align: 'end' });
		expect(scrollTop).toBe(300 * ITEM + ITEM - 100);
	});

	it('scrollToIndex works in a grid (row based)', () => {
		const controller = new VirtualizeController();
		mount({ controller, columns: 4 });
		expect(rendered().length).toBe(4 * 11);
		controller.scrollToIndex(41); // row 10
		expect(scrollTop).toBe(10 * ITEM);
		expect(rendered()).toContain(41);
		expect(rendered().every((i) => i >= 36)).toBe(true);
		expect(rendered().length % 4).toBe(0);
	});

	it('supports a columns function driven by container width', () => {
		Object.defineProperty(list, 'clientWidth', { value: 300, configurable: true });
		mount({ columns: (w: number) => Math.floor(w / 100) });
		expect(rendered().length % 3).toBe(0);
	});

	it('remembers scrollToIndex calls made before the first render', () => {
		const controller = new VirtualizeController();
		controller.scrollToIndex(200);
		mount({ controller });
		expect(scrollTop).toBe(200 * ITEM);
		expect(rendered()).toContain(200);
	});

	it('throws on duplicate keys inside the window', () => {
		expect(() => mount({ keyFn: () => 'same' })).toThrow(/duplicate key/);
	});

	it('uses keyFn so rows survive data shifts', () => {
		const render = mount({ keyFn: (d: { id: string }) => d.id });
		const el = list.querySelector('[data-i="3"]');
		part.update([virtualize(data, { itemHeight: ITEM, overscan: 1, keyFn: (d: { id: string }) => d.id, renderItem: render as any })]);
		expect(list.querySelector('[data-i="3"]')).toBe(el);
	});

	it('dispose removes rows, spacers and listeners', async () => {
		const render = mount();
		part.dispose();
		expect(list.querySelectorAll('[data-i]').length).toBe(0);
		expect(spacers().length).toBe(0);
		render.mockClear();
		scroller.dispatchEvent(new Event('scroll'));
		await frame();
		expect(render).not.toHaveBeenCalled();
	});

	describe('variable heights', () => {
		const heightOf = (r: number) => 10 + (r % 3) * 10; // 10, 20, 30, ...
		const offsetOf = (r: number) => {
			let t = 0;
			for (let i = 0; i < r; i++) t += heightOf(i);
			return t;
		};

		it('measures rows and sizes the spacers from real heights', () => {
			rowHeight = heightOf;
			mount({ itemHeight: undefined, estimatedItemHeight: 10 });
			const idx = rendered();
			expect(idx[0]).toBe(0);
			// The window covers 100px of real content plus overscan, so fewer rows than the estimate implies.
			expect(idx.length).toBeLessThan(11);
			const last = idx[idx.length - 1];
			const [, bottom] = spacers();
			const knownTail = 1000 - 1 - last; // unmeasured rows use the estimate
			expect(parseFloat(bottom.style.height)).toBeGreaterThan(knownTail * 10 - 1);
		});

		it('scrollToIndex converges so the target row lands at the viewport top', () => {
			rowHeight = heightOf;
			const controller = new VirtualizeController();
			mount({ itemHeight: undefined, estimatedItemHeight: 10, controller });
			controller.scrollToIndex(300);
			const el = list.querySelector<HTMLElement>('[data-i="300"]')!;
			expect(el).not.toBeNull();
			expect(Math.abs(el.getBoundingClientRect().top)).toBeLessThan(1);
		});

		it('keeps content anchored when a row above the viewport grows', async () => {
			const callbacks: Array<() => void> = [];
			vi.stubGlobal(
				'ResizeObserver',
				class {
					constructor(cb: () => void) {
						callbacks.push(cb);
					}
					observe() {}
					unobserve() {}
					disconnect() {}
				},
			);
			try {
				rowHeight = heightOf;
				mount({ itemHeight: undefined, estimatedItemHeight: 10 });
				scrollTop = 2000;
				scroller.dispatchEvent(new Event('scroll'));
				await frame();
				const el = [...list.querySelectorAll<HTMLElement>('[data-i]')].find((e) => {
					const r = e.getBoundingClientRect();
					return r.top <= 0 && r.bottom > 0; // the row at the viewport top
				})!;
				expect(el).toBeDefined();
				const row = Number(el.dataset.i);
				const before = el.getBoundingClientRect().top;
				const scrollBefore = scrollTop;
				rowHeight = (r) => heightOf(r) + (r === row - 1 ? 50 : 0); // e.g. an image loaded
				callbacks.forEach((cb) => cb());
				expect(el.getBoundingClientRect().top).toBeCloseTo(before, 0);
				expect(scrollTop).toBe(scrollBefore + 50);
			} finally {
				vi.unstubAllGlobals();
			}
		});
		it('works with neither itemHeight nor estimatedItemHeight', () => {
			rowHeight = heightOf;
			const controller = new VirtualizeController();
			mount({ itemHeight: undefined, controller });
			expect(rendered()[0]).toBe(0);
			controller.scrollToIndex(300);
			const el = list.querySelector<HTMLElement>('[data-i="300"]')!;
			expect(el).not.toBeNull();
			expect(Math.abs(el.getBoundingClientRect().top)).toBeLessThan(1);
		});

		it('rejects non-positive heights', () => {
			expect(() => part.update([virtualize([], { itemHeight: 0, renderItem: () => '' })])).toThrow(/itemHeight/);
			expect(() => part.update([virtualize([], { estimatedItemHeight: -1, renderItem: () => '' })])).toThrow(/estimatedItemHeight/);
		});
	});});
