import { Directive, directive, assertChildPart, renderWith, DEV, type DirectivePart, type DirectiveResult, type PartInfo } from '@std-ui/core';
import { MapByKeyRenderer } from './map-by-key-renderer.js';

class MapByKeyDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		assertChildPart(partInfo, 'mapByKey');
	}

	override update(
		_part: DirectivePart,
		items: Iterable<unknown>,
		keyFn: (item: unknown, index: number) => unknown,
		template: (item: unknown, index: number) => unknown,
	) {
		const entries: { key: unknown; value: unknown }[] = [];
		const seen = new Set<unknown>();
		let index = 0;
		for (const item of items) {
			const key = keyFn(item, index);
			if (seen.has(key)) throw new Error(DEV ? `std-ui mapByKey(): duplicate key ${String(key)}.` : 'mapByKey(): duplicate key');
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
const mapByKeyDirective = directive(MapByKeyDirective);

export function mapByKey<T>(
	items: Iterable<T>,
	keyFn: (item: T, index: number) => unknown,
	template: (item: T, index: number) => unknown,
): DirectiveResult {
	return mapByKeyDirective(items, keyFn as (item: unknown, index: number) => unknown, template as (item: unknown, index: number) => unknown);
}
