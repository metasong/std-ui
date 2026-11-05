export function assertPlainField(context: { kind: string }, name: string): void {
	if (context.kind !== 'field') {
		throw new Error(`@${name}() can only decorate a plain class field (no 'accessor'), e.g. \`@${name}(...) foo!: Foo;\`.`);
	}
}
