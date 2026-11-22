// --- Directive protocol: lets a bare `name=${...}` attribute value, or a whole child-content
// value, take over applying itself to the DOM instead of being handled the default way (stringified
// by `AttributePart`, or text/template/array-diffed by `ChildPart`). This is the only extension
// point `AttributePart`/`ChildPart` know about - neither has built-in knowledge of any specific
// directive (`classMap`, `styleMap`, `html`, or anything else); all of that lives in each
// directive's own module under `./directives/`. The `Directive`/`directive()` pair (see
// trimmed to the two binding kinds this engine
// actually produces (no async/`ElementPart`/boolean-attribute/property/event directives).

const directiveTag = Symbol('directiveResult');

/** Returned from `update()` to mean "I already applied my update (or there's nothing
 *  new to apply) - leave whatever's currently on the element alone". Distinct from returning
 *  `null`/`undefined`, which still means "remove this attribute". */
export const noChange: unique symbol = Symbol('noChange');

/**
 * What `update()` may return. Deliberately `unknown`, not a fixed union: what's
 * actually committable depends on which kind of position the directive is bound to -
 * `string`/`number`/`null`/`undefined` for an `AttributePart` (stringified/removed), or anything
 * a `ChildPart` already knows how to commit (a string, `TemplateResult`, array, `null`/`undefined`
 * /`false`, or another directive's wrapper - see `directives/unsafe-html/main.ts`) for a `ChildPart`. `noChange` is
 * the one value both recognize the same way: "I already applied my update myself - leave whatever
 * I didn't just touch alone."
 */
export type DirectiveReturn = unknown;

// `PartType` lives in `parts/DirectivePart.ts` (shared with The factory); re-exported for directive authors.
import { PartType } from '../parts/part.js';

/** Metadata + live DOM access for a plain `name=${...}` attribute binding. Passed to a
 *  `Directive`'s constructor (as `PartInfo`, for one-time validation) and to `update()` (as
 *  `DirectivePart`, for imperative DOM access) - see `Directive` below. These are distinct
 *  interfaces (`PartInfo` is metadata-only; `DirectivePart` adds live DOM refs); they're unified here since
 *  this engine never needs metadata without the live DirectivePart. */
export interface AttributePartInfo {
	readonly type: typeof PartType.ATTRIBUTE;
	/** The element this attribute is on. */
	readonly element: Element;
	/** The attribute name, e.g. `'class'`. */
	readonly name: string;
	/**
	 * Set only when this directive's attribute mixes static text (and/or other plain-value
	 * interpolations) alongside it, e.g. `class="${classMap(...)} extra"` or
	 * `style="${styleMap(...)}border:1px solid red;"` (see `AttributePart` in `../../parts/`, which
	 * computes this generically - it has no built-in knowledge of what kind of directive it's
	 * dealing with). The surrounding literal text, with every *other* value already stringified in
	 * and this directive's own slot(s) replaced with `''`. `undefined` when this directive is the
	 * attribute's only interpolation (the common case).
	 *
	 * A directive that wants to support being mixed with static text reads this in `update()` (e.g.
	 * `classMap` tokenizes it the same way it tokenizes its own object argument, then diffs the
	 * union) and applies the combined result imperatively, returning `noChange` as usual - an
	 * `AttributePart` can't meaningfully fold an imperative directive's effect back into a single
	 * composed attribute string. A directive that ignores `staticText` simply doesn't support being
	 * mixed with static text (`AttributePart` throws if it returns anything other than `noChange`
	 * while `staticText` is set).
	 */
	readonly staticText?: string;
}

/** A `.name=${...}` property binding (see `PropertyPart` in `parts/`) reports as an attribute DirectivePart
 *  (`type: ATTRIBUTE`) with `property: true`; `name` is the property name without the `.` sigil,
 *  e.g. `'value'`. */
export interface PropertyPartInfo extends AttributePartInfo {
	/** Marks a property binding; absent on plain attribute parts. */
	readonly property: true;
}

/** Whether `info` belongs to a `.name=${...}` property binding (as opposed to a plain attribute). */
export function isPropertyPartInfo(info: PartInfo): info is PropertyPartInfo {
	return (info as Partial<PropertyPartInfo>).property === true;
}

/** Metadata + live DOM access for an element binding - an interpolation inside an opening tag with
 *  no attribute name, e.g. `<input ${ref(inputRef)}>` (see `ElementPart` in `parts/`). Only
 *  directives can be bound here; whatever `update()` returns is ignored. */
export interface ElementPartInfo {
	readonly type: typeof PartType.ELEMENT;
	readonly element: Element;
	/** The `host` passed to the top-level `render()` (the component), if any. */
	readonly host?: unknown;
}

/** Metadata + live DOM access for a child-content binding - see `ChildPart` in `parts/`. Unlike
 *  `AttributePartInfo`, a child directive isn't expected to mutate `anchor`'s siblings directly;
 *  it returns a value instead (see `DirectiveReturn`) for `ChildPart` to commit the normal way -
 *  `anchor` is exposed mainly so a directive can validate/describe where it's bound, same role
 *  `AttributePartInfo.element`/`.name` play for `classMap`/`styleMap`. */
export interface ChildPartInfo {
	readonly type: typeof PartType.CHILD;
	/** The persistent comment node this child position is rendered before. */
	readonly anchor: Comment;
}

/** Every `DirectivePart`/`PartInfo` shape this engine constructs; see `AttributePartInfo`/`ChildPartInfo`.
 *  A directive's constructor/`update()` narrows via `partInfo.type`/`DirectivePart.type` to find out which
 *  one it actually got. */
export type PartInfo = AttributePartInfo | ChildPartInfo | ElementPartInfo;
export type DirectivePart = AttributePartInfo | ChildPartInfo | ElementPartInfo;

/**
 * Base class for a custom attribute directive. One instance is created *per binding position* the
 * first time a `directive()`-made function's result is bound there, and reused across re-renders
 * at that same position - so instance fields are exactly where to keep "what did I do last time"
 * state (e.g. `classMap`'s previously-added classes).
 *
 * One output hook, `update()`:
 *
 * - `constructor(partInfo)` - one-time setup, run only the first time this directive is used at a
 *   given position (e.g. validate it's bound somewhere supported, see `PartType`).
 * - `update(DirectivePart, ...args)` - the single way to produce output, called on every render with the
 *   live `DirectivePart`. `args` are real typed trailing parameters (e.g. `update(DirectivePart, a: number, b:
 *   string)`), and `directive()` infers the callable's signature from them. Return:
 *   - `noChange` - you already updated the DOM yourself (or there is nothing to do);
 *   - a raw value (string, `null`/`undefined` to remove an attribute, a template, ...) for the
 *     DirectivePart to commit;
 *   - a renderer (`renderWith(MyRenderer, value)`) for a `ChildPart` to commit through.
 *
 *   class HelloDirective extends Directive {
 *   	update(_part: DirectivePart, name: string) {
 *   		return `Hello, ${name}!`;
 *   	}
 *   }
 *   export const hello = directive(HelloDirective);
 *   // t`<div title=${hello('Ada')}></div>`
 */
export abstract class Directive {
	constructor(_partInfo: PartInfo) {}

	/** Tracked in template render effects.
	 * The one output hook: mutate the DOM via `DirectivePart` and return `noChange`, or return a raw value /
	 *  renderer for the DirectivePart to commit. Declare whatever typed parameters you need after `DirectivePart`. */
	abstract update(DirectivePart: DirectivePart, ...args: readonly unknown[]): DirectiveReturn;

	/** Optional cleanup hook (default: no-op). Called once when this instance stops being used at
	 *  its position: the position is later given a plain value or a different directive, or its
	 *  content is torn down (e.g. the enclosing template is removed). Release timers, observers,
	 *  listeners or DOM you created in `update()` here. */
	disconnected(): void {}
}

type DirectiveClass = new (partInfo: PartInfo) => Directive;

/** Everything after `update()`'s first (`DirectivePart`) parameter, as declared on an override - so a
 *  directive can take any number of individually-typed trailing parameters, not just one bundled
 *  array. Resolves to `never` if `update()`'s `Parameters<>` somehow doesn't start with a `DirectivePart`
 *  (shouldn't happen for a `Directive` subclass). */
type UpdateArgs<C extends DirectiveClass> = Parameters<InstanceType<C>['update']> extends [DirectivePart, ...infer Rest]
	? Rest
	: never;

type DirectiveArgs<C extends DirectiveClass> = UpdateArgs<C>;

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
 * template, e.g. `directive(HelloDirective)` -> `hello`, used as `` t`...${hello('Ada')}...` ``.
 * The returned function's parameters are inferred from `update()`'s trailing parameters (see
 * `DirectiveArgs`).
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
 * Applies `result` to `DirectivePart`, reusing `previous`'s `Directive` instance (and thus its state) when
 * `result` was made by the same `directive()` call site as last time, or constructing a fresh one
 * otherwise (first use at this position, or a different directive than last render - this is also
 * when the constructor's one-time `partInfo` validation runs). Called by `AttributePart`/
 * `ChildPart`; exported so it stays the one place that owns this per-position instance cache.
 *
 * @param DirectivePart - The live binding position being updated - an `AttributePartInfo` or
 *   `ChildPartInfo`; passed to the constructor (as `PartInfo`) when a new instance is built, and
 *   to `update()` on every call.
 * @param result - This render's `directive()`-made value: which `Directive` subclass to use
 *   (`result.Ctor`) and the arguments to call its lifecycle methods with (`result.args`).
 * @param previous - The `Directive` instance bound at this position last render, or `undefined`
 *   on the very first render here. Reused (along with its state) only if its constructor is
 *   exactly `result.Ctor`; otherwise a fresh instance is constructed from `result.Ctor`.
 * @returns The instance that ended up handling this update (new or reused) plus whatever its
 *   `update()` returned, for `AttributePart` to commit (or skip, on `noChange`).
 */
export function applyDirective(DirectivePart: DirectivePart, result: DirectiveResult, previous: Directive | undefined): AppliedDirective {
	let instance: Directive;
	if (previous?.constructor === result.Ctor) instance = previous;
	else {
		previous?.disconnected();
		instance = new result.Ctor(DirectivePart);
	}
	const value = instance.update(DirectivePart, ...result.args);
	return { instance, value };
}
