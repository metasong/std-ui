import { Directive, directive, PartType, type DirectiveResult, type PartInfo } from '../../directive.js';
import { commitWith } from '../../parts/committers/index.js';
import { MapByKeyCommitter } from './map-by-key-committer.js';

class MapByKeyDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui mapByKey(): must be bound to a child position.');
		}
	}

	override render(
		items: Iterable<unknown>,
		keyFn: ((item: unknown, index: number) => unknown) | undefined,
		template: (item: unknown, index: number) => unknown,
	) {
		const entries: { key: unknown; value: unknown }[] = [];
		const seen = new Set<unknown>();
		let index = 0;
		for (const item of items) {
			const key = keyFn ? keyFn(item, index) : index;
			if (seen.has(key)) throw new Error(`std-ui mapByKey(): duplicate key ${String(key)}.`);
			seen.add(key);
			entries.push({ key, value: template(item, index) });
			index++;
		}
		return commitWith(MapByKeyCommitter, entries);
	}
}

const mapByKeyDirective = directive(MapByKeyDirective);

/**
 * Keyed list rendering. Items with the same key keep their DOM (and state) when reordered.
 *
 *   html`<ul>${mapByKey(todos, (t) => t.id, (t) => html`<li>${t.text}</li>`)}</ul>`
 *   html`<ul>${mapByKey(names, (n) => html`<li>${n}</li>`)}</ul>`   // keyed by index
 */
export function mapByKey<T>(
	items: Iterable<T>,
	keyFn: (item: T, index: number) => unknown,
	template: (item: T, index: number) => unknown,
): DirectiveResult;
export function mapByKey<T>(items: Iterable<T>, template: (item: T, index: number) => unknown): DirectiveResult;
export function mapByKey<T>(
	items: Iterable<T>,
	keyOrTemplate: (item: T, index: number) => unknown,
	template?: (item: T, index: number) => unknown,
): DirectiveResult {
	const keyFn = template ? keyOrTemplate : undefined;
	const render = template ?? keyOrTemplate;
	return mapByKeyDirective(
		items,
		keyFn as ((item: unknown, index: number) => unknown) | undefined,
		render as (item: unknown, index: number) => unknown,
	);
}
