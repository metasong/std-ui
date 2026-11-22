import { PartType } from '../parts/part.js';
import type { ChildPartInfo, PartInfo } from './directive.js';
import { DEV } from '../../../dev/flag.js';

/** Throws unless `info` is a child-content binding. Call from a child-only directive's constructor. */
export function assertChildPart(info: PartInfo, name: string): asserts info is ChildPartInfo {
	if (info.type !== PartType.CHILD) {
		throw new Error(DEV ? `std-ui ${name}(): must be bound to a child position, not an attribute.` : `${name}(): child position only`);
	}
}
