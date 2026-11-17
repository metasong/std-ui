import { Directive, directive, PartType, type DirectivePart, type PartInfo } from 'std-ui';
import { renderWith } from 'std-ui';
import { VirtualizeRenderer } from './renderer/index.js';
import type { VirtualizeOptions } from './options.js';

class VirtualizeDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui virtualize(): must be bound to a child position.');
		}
	}

	override update(_part: DirectivePart, items: ArrayLike<unknown>, options: VirtualizeOptions<any>) {
		for (const name of ['itemSize', 'estimatedItemSize'] as const) {
			const h = options[name];
			if (h !== undefined && !(h > 0)) throw new Error(`std-ui virtualize(): ${name} must be > 0.`);
		}
		if (options.isHeader && typeof options.lanes === 'number' && options.lanes > 1) {
			throw new Error('std-ui virtualize(): isHeader requires lanes = 1.');
		}
		return renderWith(VirtualizeRenderer, { items, options });
	}
}

/**
 * Windowed rendering for large lists and grids. Only the rows near the viewport exist in the DOM;
 * two spacer elements stand in for the rest. Pass `itemSize` for fixed-size items, or
 * `estimatedItemSize` to let items be any size (rows are measured after render). Set\r\n * `direction: 'horizontal'` to scroll along x.
 *
 *   t`<div class="list">${virtualize(rows, {
 *     itemSize: 32,
 *     renderItem: (r) => t`<div class="row">${r.name}</div>`,
 *   })}</div>`
 *
 * For a grid, set `lanes` and give the container `display: grid` with matching columns/gap.
 */
export const virtualize = directive(VirtualizeDirective) as <T>(
	items: ArrayLike<T>,
	options: VirtualizeOptions<T>,
) => unknown;
