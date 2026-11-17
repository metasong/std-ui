// A renderer owns the DOM for one kind of child content (inserted before a `ChildPart`'s
// `anchor`) and knows how to update it in place or tear it down. `ChildPart` keeps at most one,
// reusing it while successive values map to the same class and replacing it otherwise.

export abstract class ChildRenderer<V> {
	constructor(protected readonly anchor: Comment, protected readonly host?: unknown) {}
	/** Apply `value`, reusing existing DOM where possible. Return `false` (having changed nothing)
	 *  if this renderer can't be reused for `value`; `ChildPart` then replaces it. */
	abstract update(value: V): boolean;
	/** Remove everything this renderer inserted. */
	abstract dispose(): void;
	/** Run `disconnected()` on directives in nested content without touching the DOM. Override
	 *  only if this renderer owns nested parts. */
	disconnect(): void {}
}

export type ChildRendererClass = new (anchor: Comment, host?: unknown) => ChildRenderer<any>;

// --- Directive-supplied renderers --------------------------------------------------------------
// A child directive can return `renderWith(MyRenderer, value)` from `render()`/`update()` to have
// `ChildPart` render `value` using the directive's own renderer, so `ChildPart` needs no
// knowledge of the directive and all its logic can live in the directive's module.

const renderWithTag = Symbol('renderWith');

export interface RenderWith<V = unknown> {
	readonly [renderWithTag]: true;
	readonly Ctor: new (anchor: Comment, host?: unknown) => ChildRenderer<V>;
	readonly value: V;
}

export function renderWith<V>(Ctor: new (anchor: Comment, host?: unknown) => ChildRenderer<V>, value: V): RenderWith<V> {
	return { [renderWithTag]: true, Ctor, value };
}

export function isRenderWith(value: unknown): value is RenderWith {
	return typeof value === 'object' && value !== null && renderWithTag in value;
}
