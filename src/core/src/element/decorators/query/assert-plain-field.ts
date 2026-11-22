import { DEV } from '../../../dev/flag.js';
export function assertPlainField(context: { kind: string }, name: string): void {
	if (context.kind !== 'field') {
		throw new Error(DEV ? `@${name}() can only decorate a plain class field (no 'accessor'), e.g. \`@${name}(...) foo!: Foo;\`.` : 'query decorator: plain fields only');
	}
}
