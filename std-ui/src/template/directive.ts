// --- Attribute directive protocol: lets a bare `name="${...}"` value take over applying itself to
// the element, instead of being stringified by `AttributePart`. This is the only extension point
// `AttributePart` knows about - it has no built-in knowledge of any specific directive (`classMap`,
// `styleMap`, or anything else); all of that lives in each directive's own module under
// `../directives/`. Mirrors lit-html's `Directive`/`directive()` pair (see
// https://lit.dev/docs/templates/custom-directives/), trimmed to this engine's one directive site:
// a bare attribute binding (no child-content/async directives). See `unsafe-html.ts` for the
// analogous protocol on the child-content side.

const directiveTag = Symbol('directiveResult');

/** Returned from `render()`/`update()` to mean "I already applied my update (or there's nothing
 *  new to apply) - leave whatever's currently on the element alone". Distinct from returning
 *  `null`/`undefined`, which still means "remove this attribute". */
export const noChange: unique symbol = Symbol('noChange');

/** What `render()`/`update()` may return: a value for `AttributePart` to commit via
 *  `setAttribute` (stringified)/`removeAttribute` (`null`/`undefined`), or `noChange`. */
export type DirectiveReturn = string | number | null | undefined | typeof noChange;

/**
 * Mirrors lit-html's `PartType` - which *kind* of template expression a directive is bound to, so a
 * directive can check `partInfo.type`/`part.type` (see `Directive`'s constructor and `update()`
 * below) and throw if used somewhere it doesn't support, e.g. `classMap` requiring `ATTRIBUTE` +
 * `name === 'class'`. Only `ATTRIBUTE` is actually produced by this engine today - this stays a
 * full union so the shape has room to grow if `ChildPart`/`BooleanAttributePart`/`EventPart`/
 * `PropertyPart`/`ElementPart` gain directive support later, same as lit-html's.
 */
export const PartType = {
	ATTRIBUTE: 'attribute',
	BOOLEAN_ATTRIBUTE: 'boolean-attribute',
	PROPERTY: 'property',
	EVENT: 'event',
	CHILD: 'child',
	ELEMENT: 'element',
} as const;
export type PartType = (typeof PartType)[keyof typeof PartType];

/** Metadata + live DOM access for the one binding kind that currently dispatches to directives:
 *  a plain `name="${...}"` attribute. Passed to a `Directive`'s constructor (as `PartInfo`, for
 *  one-time validation) and to `update()` (as `Part`, for imperative DOM access) - see `Directive`
 *  below. In lit-html these are distinct interfaces (`PartInfo` is metadata-only; `Part` adds live
 *  DOM refs); they're unified here since this engine never needs metadata without the live part. */
export interface AttributePartInfo {
	readonly type: typeof PartType.ATTRIBUTE;
	/** The element this attribute is on. */
	readonly element: Element;
	/** The attribute name, e.g. `'class'`. */
	readonly name: string;
}

/** The only `Part`/`PartInfo` shape this engine constructs today; see `AttributePartInfo`. */
export type PartInfo = AttributePartInfo;
export type Part = AttributePartInfo;

/**
 * Base class for a custom attribute directive. One instance is created *per binding position* the
 * first time a `directive()`-made function's result is bound there, and reused across re-renders
 * at that same position - so instance fields are exactly where to keep "what did I do last time"
 * state (e.g. `classMap`'s previously-added classes).
 *
 * Three lifecycle hooks, same roles as lit-html's:
 *
 * - `constructor(partInfo)` - one-time setup, run only the first time this directive is used at a
 *   given position. Receives metadata about where it's bound; useful for validating it's being
 *   used somewhere it supports (see `PartType` above), e.g. "must be the `class` attribute".
 * - `render()` - declarative: return the value to commit (a string, or `null`/`undefined` to
 *   remove the attribute). Implement this for a directive that just computes a value with no need
 *   to touch the DOM directly.
 * - `update(part, ...args)` - imperative: called on every render instead of `render()`, with
 *   direct access to the live `part` (its `.element`). `args` are the same values `render()` would
 *   receive - as real trailing parameters, not a single bundled array, so you can declare however
 *   many typed parameters the directive actually takes (e.g. `update(part, classes: ClassInfo)`,
 *   or `update(part, a: number, b: string)`). The default implementation just calls and returns
 *   `render(...args)`; override `update()` instead when you need to mutate the DOM yourself -
 *   typically returning `noChange` once you have, so `AttributePart` does nothing further.
 *
 * `directive()` infers the callable function's parameters from *whichever* of the two you actually
 * gave a concrete signature - override `update()` alone, with its own typed trailing parameters,
 * and that's all you need; there's no requirement to also implement `render()` just so
 * `directive()` can see the argument types (see `DirectiveArgs`/`directive()` below).
 *
 *   class HelloDirective extends Directive {
 *   	render(name: string) {
 *   		return `Hello, ${name}!`;
 *   	}
 *   }
 *   export const hello = directive(HelloDirective);
 *   // html`<div title="${hello('Ada')}"></div>`
 */
export abstract class Directive {
	constructor(_partInfo: PartInfo) {}

	/** Declarative rendering: return the value `AttributePart` should commit. Called by the default
	 *  `update()` - implement this unless you override `update()` instead. */
	render(...args: readonly unknown[]): DirectiveReturn {
		throw new Error('Directive subclasses must implement render() or override update().');
	}

	/** Imperative DOM access: override to read/mutate `part.element` directly, declaring whatever
	 *  typed parameters you need after `part` (same values `render()` would receive). Defaults to
	 *  calling and returning `this.render(...args)`. */
	update(part: Part, ...args: readonly unknown[]): DirectiveReturn {
		return this.render(...args);
	}
}

type DirectiveClass = new (partInfo: PartInfo) => Directive;

/** Everything after `update()`'s first (`part`) parameter, as declared on an override - so a
 *  directive can take any number of individually-typed trailing parameters, not just one bundled
 *  array. Resolves to `never` if `update()`'s `Parameters<>` somehow doesn't start with a `Part`
 *  (shouldn't happen for a `Directive` subclass). */
type UpdateArgs<C extends DirectiveClass> = Parameters<InstanceType<C>['update']> extends [Part, ...infer Rest]
	? Rest
	: never;

/** `directive()`'s inferred parameter list: whatever trailing parameters `update()` declares after
 *  `part`, or `render()`'s parameters if `update()` wasn't overridden (i.e. its trailing parameters
 *  are still the base class's generic `readonly unknown[]` rest). This is what lets `directive()`
 *  infer a directive function's argument types from *either* lifecycle method, so a directive that
 *  only overrides `update()` doesn't also need a `render()` implementation just for `directive()`
 *  to see its argument types. */
type DirectiveArgs<C extends DirectiveClass> = readonly unknown[] extends UpdateArgs<C>
	? Parameters<InstanceType<C>['render']>
	: UpdateArgs<C>;

/** What a `directive()`-made function actually returns: inert until `AttributePart` applies it. */
export interface DirectiveResult {
	readonly [directiveTag]: true;
	readonly Ctor: DirectiveClass;
	readonly args: readonly unknown[];
}

/**
 * @param value - Anything a template interpolation produced - a plain string/number, `null`, a
 *   `classMap()`/`styleMap()`/custom `directive()`-made call, etc.
 * @returns `true` only for values made by a `directive()`-made function (tagged with the private
 *   `directiveTag` symbol); `AttributePart` uses this to decide whether to dispatch to
 *   `applyDirective()` or just stringify the value as usual.
 */
export function isDirectiveResult(value: unknown): value is DirectiveResult {
	return typeof value === 'object' && value !== null && directiveTag in value;
}

/**
 * Turns a `Directive` subclass into the callable directive function consumers actually use in a
 * template, e.g. `directive(HelloDirective)` -> `hello`, used as `` html`...${hello('Ada')}...` ``.
 * The returned function's parameters are inferred from whichever of `render()`/`update()` the
 * subclass gave a concrete signature (see `DirectiveArgs`) - mirrors lit-html's rule that "the
 * parameters defined for the render() method determine the signature of the directive function",
 * extended to also work for directives that only override `update()`.
 *
 * @param Ctor - The `Directive` subclass (not an instance) to wrap, e.g. `HelloDirective`.
 * @returns A function - e.g. `hello` - that consumers call inside a template interpolation. It
 *   does no DOM work itself; it just captures `Ctor` plus whatever arguments it was called with
 *   into an inert `DirectiveResult`, later consumed by `applyDirective()`.
 */
export function directive<C extends DirectiveClass>(Ctor: C): (...args: DirectiveArgs<C>) => DirectiveResult {
	return (...args: DirectiveArgs<C>): DirectiveResult => ({ [directiveTag]: true, Ctor, args });
}

/** What `AttributePart` gets back after dispatching to a directive: the (possibly newly
 *  constructed) instance to keep around, plus whatever `update()` returned. */
export interface AppliedDirective {
	readonly instance: Directive;
	readonly value: DirectiveReturn;
}

/**
 * Applies `result` to `part`, reusing `previous`'s `Directive` instance (and thus its state) when
 * `result` was made by the same `directive()` call site as last time, or constructing a fresh one
 * otherwise (first use at this position, or a different directive than last render - this is also
 * when the constructor's one-time `partInfo` validation runs). Called by `AttributePart`; exported
 * so it stays the one place that owns this per-position instance cache.
 *
 * @param part - The live attribute position being updated; passed to the constructor (as
 *   `PartInfo`) when a new instance is built, and to `update()`/`render()` on every call.
 * @param result - This render's `directive()`-made value: which `Directive` subclass to use
 *   (`result.Ctor`) and the arguments to call its lifecycle methods with (`result.args`).
 * @param previous - The `Directive` instance bound at this position last render, or `undefined`
 *   on the very first render here. Reused (along with its state) only if its constructor is
 *   exactly `result.Ctor`; otherwise a fresh instance is constructed from `result.Ctor`.
 * @returns The instance that ended up handling this update (new or reused) plus whatever its
 *   `update()` returned, for `AttributePart` to commit (or skip, on `noChange`).
 */
export function applyDirective(part: Part, result: DirectiveResult, previous: Directive | undefined): AppliedDirective {
	const instance = previous?.constructor === result.Ctor ? previous : new result.Ctor(part);
	const value = instance.update(part, ...result.args);
	return { instance, value };
}
