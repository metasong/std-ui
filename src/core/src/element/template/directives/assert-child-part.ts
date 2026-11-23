import { PartType } from '../parts/part.js';
import type { ChildPartInfo, PartInfo } from './directive.js';
import { DEV } from '../../../dev/flag.js';
import { usageError } from '../../../util.js';

/** Throws unless `ok`. One throw site for every "directive bound in the wrong position" check;
 *  `where` completes "must be bound to ..." in DEV, release builds only keep a short message. */
export function assertPosition(ok: boolean, name: string, where: string): asserts ok {
	if (!ok) throw usageError(DEV && `std-ui ${name}(): must be bound to ${where}.`, name);
}

/** Throws unless `info` is a child-content binding. Call from a child-only directive's constructor. */
export function assertChildPart(info: PartInfo, name: string): asserts info is ChildPartInfo {
	assertPosition(info.type === PartType.CHILD, name, 'a child position, not an attribute');
}
