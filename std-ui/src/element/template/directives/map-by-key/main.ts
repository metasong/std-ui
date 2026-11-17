import { Directive, directive, type Part, type PartInfo } from '../directive.js';
import { PartType } from '../../parts/part.js';
import { renderWith } from '../../parts/renderers/index.js';
import { MapByKeyRenderer } from './map-by-key-renderer.js';

class MapByKeyDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui mapByKey(): must be bound to a child position.');
		}
	}

	override update(
		_part: Part,
		items: Iterable<unknown>,
		keyFn: (item: unknown, index: number) => unknown,
		template: (item: unknown, index: number) => unknown,
	) {
		const entries: { key: unknown; value: unknown }[] = [];
		const seen = new Set<unknown>();
		let index = 0;
		for (const item of items) {
			const key = keyFn(item, index);
			if (seen.has(key)) throw new Error(`std-ui mapByKey(): duplicate key ${String(key)}.`);
			seen.add(key);
			entries.push({ key, value: template(item, index) });
			index++;
		}
		return renderWith(MapByKeyRenderer, entries);
	}
}

/**
 * Keyed list rendering. Items with the same key keep their DOM (and state) when reordered.
 * For fixed-order lists, use `items.map(...)` instead.
 *
 *   t`<ul>${mapByKey(todos, (t) => t.id, (t) => t`<li>${t.text}</li>`)}</ul>`
 */
export const mapByKey = directive(MapByKeyDirective);
