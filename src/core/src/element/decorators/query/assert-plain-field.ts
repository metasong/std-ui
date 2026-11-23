import { DEV } from '../../../dev/flag.js';
import { usageError } from '../../../util.js';
export function assertPlainField(context: { kind: string }, name: string): void {
	if (context.kind !== 'field') {
		throw usageError(DEV && `@${name}() can only decorate a plain class field (no 'accessor'), e.g. \`@${name}(...) foo!: Foo;\`.`, name);
	}
}
