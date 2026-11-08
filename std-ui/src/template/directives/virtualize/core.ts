import { Directive, directive, PartType, type PartInfo } from '../../directive.js';
import { commitWith } from '../../parts/committers/index.js';
import { VirtualizeCommitter, type VirtualizeOptions } from './virtualize-committer.js';

class VirtualizeDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui virtualize(): must be bound to a child position.');
		}
	}

	override render(items: ArrayLike<unknown>, options: VirtualizeOptions<any>) {
		if (!(options.itemHeight > 0)) throw new Error('std-ui virtualize(): itemHeight must be > 0.');
		return commitWith(VirtualizeCommitter, { items, options });
	}
}

/**
 * Windowed rendering for large lists and grids. Only the rows near the viewport exist in the DOM;
 * two spacer elements stand in for the rest. Items must have a fixed height (`itemHeight`).
 *
 *   html`<div class="list">${virtualize(rows, {
 *     itemHeight: 32,
 *     renderItem: (r) => html`<div class="row">${r.name}</div>`,
 *   })}</div>`
 *
 * For a grid, set `columns` and give the container `display: grid` with matching columns/gap.
 */
export const virtualize = directive(VirtualizeDirective) as <T>(
	items: ArrayLike<T>,
	options: VirtualizeOptions<T>,
) => unknown;
