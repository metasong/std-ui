import { Directive, directive, PartType, type DirectiveResult, type PartInfo } from '../directive.js';
import { ChildPart } from '../parts/child-part.js';
import { Committer, commitWith } from '../parts/committers/index.js';

// Everything `repeat` needs - the directive, its keyed-reconciliation committer - lives here;
// `ChildPart` only knows the generic `commitWith()` protocol.

type Entries = ReadonlyArray<{ readonly key: unknown; readonly value: unknown }>;

/** One item: its DOM lives between `start` and `part.endNode` (inclusive). */
interface KeyedItem {
	start: Comment;
	part: ChildPart;
}

function removeKeyed(item: KeyedItem): void {
	item.part.dispose();
	item.start.remove();
}

class RepeatCommitter extends Committer<Entries> {
	#items = new Map<unknown, KeyedItem>();
	update(entries: Entries): boolean {
		const old = this.#items;
		const next = new Map<unknown, KeyedItem>();

		// Remove items whose keys disappeared.
		const newKeys = new Set(entries.map((e) => e.key));
		for (const [key, item] of old) if (!newKeys.has(key)) removeKeyed(item);

		// Walk backwards so each item only needs to be placed before the one after it.
		let ref: Node = this.anchor;
		for (let i = entries.length - 1; i >= 0; i--) {
			const { key, value } = entries[i];
			let item = old.get(key);
			if (!item) {
				const start = document.createComment('std-ui-part');
				const end = document.createComment('std-ui-part');
				ref.parentNode!.insertBefore(start, ref);
				ref.parentNode!.insertBefore(end, ref);
				item = { start, part: new ChildPart(end) };
			} else if (item.part.endNode.nextSibling !== ref) {
				// Existing item out of place: move its whole [start..end] range before `ref`.
				const parent = ref.parentNode!;
				const range: Node[] = [];
				for (let n: Node | null = item.start; n; n = n.nextSibling) {
					range.push(n);
					if (n === item.part.endNode) break;
				}
				for (const n of range) parent.insertBefore(n, ref);
			}
			item.part.update([value]);
			next.set(key, item);
			ref = item.start;
		}
		this.#items = next;
		return true;
	}
	override disconnect(): void {
		for (const item of this.#items.values()) item.part.disconnect();
	}
	dispose(): void {
		for (const item of this.#items.values()) removeKeyed(item);
		this.#items.clear();
	}
}

class RepeatDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui repeat(): must be bound to a child position.');
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
			if (seen.has(key)) throw new Error(`std-ui repeat(): duplicate key ${String(key)}.`);
			seen.add(key);
			entries.push({ key, value: template(item, index) });
			index++;
		}
		return commitWith(RepeatCommitter, entries);
	}
}

const repeatDirective = directive(RepeatDirective);

/**
 * Keyed list rendering, like lit's `repeat`. Items with the same key keep their DOM (and
 * state) when reordered.
 *
 *   html`<ul>${repeat(todos, (t) => t.id, (t) => html`<li>${t.text}</li>`)}</ul>`
 *   html`<ul>${repeat(names, (n) => html`<li>${n}</li>`)}</ul>`   // keyed by index
 */
export function repeat<T>(
	items: Iterable<T>,
	keyFn: (item: T, index: number) => unknown,
	template: (item: T, index: number) => unknown,
): DirectiveResult;
export function repeat<T>(items: Iterable<T>, template: (item: T, index: number) => unknown): DirectiveResult;
export function repeat<T>(
	items: Iterable<T>,
	keyOrTemplate: (item: T, index: number) => unknown,
	template?: (item: T, index: number) => unknown,
): DirectiveResult {
	const keyFn = template ? keyOrTemplate : undefined;
	const render = template ?? keyOrTemplate;
	return repeatDirective(
		items,
		keyFn as ((item: unknown, index: number) => unknown) | undefined,
		render as (item: unknown, index: number) => unknown,
	);
}
