import { describe, expect, it } from 'vitest';
import { t, render, AttributePart, ChildPart } from '@std-ui/core';
import { MapByKeyRenderer } from './map-by-key-renderer.js';
import { mapByKey } from './main.js';

describe('mapByKey', () => {
	function makeChildPart(): { part: ChildPart; container: HTMLElement } {
		const container = document.createElement('div');
		const anchor = document.createComment('std-ui-part');
		container.appendChild(anchor);
		return { part: new ChildPart(anchor), container };
	}

	it('throws if bound to an attribute position instead of a child one', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'title');
		expect(() =>
			part.update([mapByKey(['a'], (_x, i) => i, (x) => t`<span>${x}</span>`)]),
		).toThrow(/child position/);
	});

	it('throws on duplicate keys in one render', () => {
		const { part } = makeChildPart();
		expect(() =>
			part.update([
				mapByKey(
					[
						{ id: 'x', label: '1' },
						{ id: 'x', label: '2' },
					],
					(i) => i.id,
					(i) => t`<li>${i.label}</li>`,
				),
			]),
		).toThrow(/duplicate key/);
	});

	it('renders one child part per item', () => {
		const { part, container } = makeChildPart();
		const items = [
			{ id: 'a', label: 'Ada' },
			{ id: 'b', label: 'Byron' },
		];
		part.update([
			mapByKey(
				items,
				(i) => i.id,
				(i) => t`<li>${i.label}</li>`,
			),
		]);
		expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual([
			'Ada',
			'Byron',
		]);
	});

	it('reorders rendered output when keys move (keyed reconciliation)', () => {
		const { part, container } = makeChildPart();
		const row = (id: string, label: string) => ({ id, label });
		part.update([
			mapByKey(
				[row('a', 'A'), row('b', 'B')],
				(i) => i.id,
				(i) => t`<li data-id=${i.id}>${i.label}</li>`,
			),
		]);

		part.update([
			mapByKey(
				[row('b', 'B'), row('a', 'A')],
				(i) => i.id,
				(i) => t`<li data-id=${i.id}>${i.label}</li>`,
			),
		]);

		expect(Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-id'))).toEqual([
			'b',
			'a',
		]);
	});

	it('updates row text when the key is unchanged', () => {
		const { part, container } = makeChildPart();
		part.update([mapByKey([{ id: 1, t: 'old' }], (i) => i.id, (i) => i.t)]);
		part.update([mapByKey([{ id: 1, t: 'new' }], (i) => i.id, (i) => i.t)]);
		expect(container.textContent).toBe('new');
	});

	it('removes DOM for keys that disappear', () => {
		const { part, container } = makeChildPart();
		part.update([
			mapByKey(
				[
					{ id: 'stay', t: '1' },
					{ id: 'go', t: '2' },
				],
				(i) => i.id,
				(i) => t`<p data-id=${i.id}>${i.t}</p>`,
			),
		]);
		expect(container.querySelectorAll('p')).toHaveLength(2);

		part.update([
			mapByKey([{ id: 'stay', t: '1' }], (i) => i.id, (i) => t`<p data-id=${i.id}>${i.t}</p>`),
		]);
		expect(container.querySelectorAll('p')).toHaveLength(1);
		expect(container.querySelector('p')!.getAttribute('data-id')).toBe('stay');
	});

	it('MapByKeyRenderer removes stale keys on direct update', () => {
		const container = document.createElement('div');
		const anchor = document.createComment('std-ui-part');
		container.appendChild(anchor);
		const renderer = new MapByKeyRenderer(anchor);

		renderer.update([
			{ key: 0, value: 'a' },
			{ key: 1, value: 'b' },
		]);
		expect(container.textContent).toBe('ab');

		renderer.update([{ key: 0, value: 'a' }]);
		expect(container.textContent).toBe('a');
	});
});

describe('mapByKey end-to-end', () => {
	it('reorders list rows through t()/render() while reusing keyed DOM', () => {
		const container = document.createElement('div');
		type Row = { id: string; label: string };
		const view = (rows: Row[]) =>
			t`<ul>${mapByKey(rows, (r) => r.id, (r) => t`<li data-id=${r.id}>${r.label}</li>`)}</ul>`;

		render(view([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]), container);
		const liA = container.querySelector('li[data-id="a"]')!;
		const liB = container.querySelector('li[data-id="b"]')!;

		render(view([{ id: 'b', label: 'B' }, { id: 'a', label: 'A' }]), container);
		expect(container.querySelector('li[data-id="b"]')).toBe(liB);
		expect(container.querySelector('li[data-id="a"]')).toBe(liA);
		expect(Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-id'))).toEqual([
			'b',
			'a',
		]);
	});
});
