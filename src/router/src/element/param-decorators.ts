// `@routeParam(name?)` / `@searchParam(name?)` field decorators: expose the current route's path
// param / the URL's query param of the nearest `<std-router>` as a read-only, reactive property.
//
// Decorators only register `{ field, source, name }` in the class's decorator metadata; on connect
// the hook defines a getter on the instance that reads the router's signals, so effects and
// templates that read the field re-run when the URL changes.

import { addClassHooks, createClassRegistry, type UIElementHooks } from '@std-ui/core';
import { findSignalBackedRouter } from './dom.js';

interface ParamFieldDef {
	field: PropertyKey;
	source: 'route' | 'search';
	name: string;
}

const paramFields = createClassRegistry<ParamFieldDef>('routerParamFieldDefs');

const paramHooks: UIElementHooks = {
	// `beforeConnect` (not `connected`) so the fields are readable inside `connect()` too.
	beforeConnect(host) {
		const defs = paramFields.get(host.constructor);
		if (defs.length === 0) return;
		const current = findSignalBackedRouter(host);
		if (!current) {
			throw new Error(`@routeParam/@searchParam on <${host.tagName.toLowerCase()}> need an ancestor <std-router>.`);
		}
		for (const { field, source, name } of defs) {
			Object.defineProperty(host, field, {
				get: (): string | undefined =>
					source === 'route'
						? current()?.params()[name]
						: (new URLSearchParams(current()?.location().search).get(name) ?? undefined),
				set(): void {
					throw new TypeError(`@${source === 'route' ? 'routeParam' : 'searchParam'} field "${String(field)}" is read-only.`);
				},
				enumerable: true,
				configurable: true,
			});
		}
	},
};

function paramDecorator(source: ParamFieldDef['source'], name: string | undefined) {
	return function (_value: undefined, ctx: ClassFieldDecoratorContext<object, string | undefined>): void {
		if (ctx.kind !== 'field' || typeof ctx.name !== 'string') {
			throw new Error(`@${source === 'route' ? 'routeParam' : 'searchParam'}() can only decorate a plain string-named class field (no 'accessor').`);
		}
		paramFields.register(ctx.metadata as object, { field: ctx.name, source, name: name ?? ctx.name });
		addClassHooks(ctx.metadata as object, paramHooks);
	};
}

/**
 * Path param of the current route, e.g. `@routeParam() readonly userId!: string` for `/users/:id`.
 * Declare the field
eadonly (decorators can't enforce it). `name` defaults to the field name. `undefined` when the route has no such param.
 */
export function routeParam(name?: string) {
	return paramDecorator('route', name);
}

/**
 * Query-string param of the current URL, e.g. `@searchParam('q') readonly query?: string`.
 * Declare the field
eadonly (decorators can't enforce it). `name` defaults to the field name. `undefined` when absent.
 */
export function searchParam(name?: string) {
	return paramDecorator('search', name);
}
