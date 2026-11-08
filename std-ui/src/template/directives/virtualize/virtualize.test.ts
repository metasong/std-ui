import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html } from '../../html.js';
import { AttributePart, ChildPart } from '../../parts/index.js';
import { virtualize } from './core.js';
import { VirtualizeController } from './controller.js';
import { computeWindow, scrollTarget, spacerHeight, totalHeight, type GridMetrics } from './layout.js';

describe('layout math', () => {
	const m: GridMetrics = { count: 100, columns: 1, itemHeight: 10, gap: 0 };

	it('computes total height with gaps', () => {
		expect(totalHeight({ ...m, gap: 2 })).toBe(100 * 12 - 2);
		expect(totalHeight({ ...m, count: 0 })).toBe(0);
		expect(totalHeight({ ...m, columns: 4, count: 10 })).toBe(3 * 10);
	});

	it('windows rows with overscan, clamped', () => {
		expect(computeWindow(m, 0, 50, 0)).toMatchObject({ start: 0, end: 5 });
		expect(computeWindow(m, 500, 50, 2)).toMatchObject({ start: 48, end: 57 });
		expect(computeWindow(m, 10_000, 50, 2)).toMatchObject({ end: 100 });
	});

	it('windows whole rows in a grid', () => {
		const g = { ...m, columns: 3, count: 10 };
		const w = computeWindow(g, 10, 10, 0); // row 1 only
		expect(w).toMatchObject({ start: 3, end: 6, startRow: 1, endRow: 2 });
		expect(computeWindow(g, 1000, 10, 0).end).toBe(10); // last partial row
	});

	it('spacer accounts for the gap that separates it from its neighbour', () => {
		expect(spacerHeight({ ...m, gap: 4 }, 3)).toBe(3 * 14 - 4);
		expect(spacerHeight(m, 0)).toBe(0);
	});

	it('scrollTarget aligns', () => {
		expect(scrollTarget(m, 20, 'start', 0, 50)).toBe(200);
		expect(scrollTarget(m, 20, 'end', 0, 50)).toBe(160);
		expect(scrollTarget(m, 20, 'center', 0, 50)).toBe(180);
		expect(scrollTarget(m, 20, 'nearest', 190, 50)).toBe(190);
		expect(scrollTarget(m, 20, 'nearest', 300, 50)).toBe(200);
		expect(scrollTarget({ ...m, columns: 4 }, 9, 'start', 0, 50)).toBe(20); // row 2
	});
});

describe('virtualize', () => {
	const ITEM = 10;
	let scroller: HTMLElement;
	let list: HTMLElement;
	let part: ChildPart;
	let scrollTop = 0;

	beforeEach(() => {
		scrollTop = 0;
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
			const top = i === undefined ? 0 : Math.floor(Number(i) / cols) * ITEM - scrollTop;
			return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON() {} };
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
});
