import { DEV } from '../../../dev/flag.js';
import { usageError } from '../../../util.js';
export function rejectArg(sigil: string, name: string, arg: string | undefined): void {
	if (arg !== undefined) throw usageError(DEV && `std-ui html: "${sigil}${name}:${arg}" - ":arg" on a binding name is reserved and not supported yet. Namespaced attributes such as xlink:href are not supported either; use the plain SVG2 name (e.g. href).`, 'binding');
}
