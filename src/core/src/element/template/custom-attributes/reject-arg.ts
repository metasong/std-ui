export function rejectArg(sigil: string, name: string, arg: string | undefined): void {
	if (arg !== undefined) throw new Error(`std-ui html: "${sigil}${name}:${arg}" - ":arg" on a binding name is reserved and not supported yet.`);
}
