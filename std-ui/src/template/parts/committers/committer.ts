// A committer owns the DOM for one kind of child content (inserted before a `ChildPart`'s
// `anchor`) and knows how to update it in place or tear it down. `ChildPart` keeps at most one,
// reusing it while successive values map to the same class and replacing it otherwise.

export abstract class Committer<V> {
	constructor(protected readonly anchor: Comment) {}
	/** Apply `value`, reusing existing DOM where possible. Return `false` (having changed nothing)
	 *  if this committer can't be reused for `value`; `ChildPart` then replaces it. */
	abstract update(value: V): boolean;
	/** Remove everything this committer inserted. */
	abstract dispose(): void;
	/** Run `disconnected()` on directives in nested content without touching the DOM. Override
	 *  only if this committer owns nested parts. */
	disconnect(): void {}
}

export type CommitterClass = new (anchor: Comment) => Committer<any>;

// --- Directive-supplied committers --------------------------------------------------------------
// A child directive can return `commitWith(MyCommitter, value)` from `render()`/`update()` to have
// `ChildPart` render `value` using the directive's own committer, so `ChildPart` needs no
// knowledge of the directive and all its logic can live in the directive's module.

const commitWithTag = Symbol('commitWith');

export interface CommitWith<V = unknown> {
	readonly [commitWithTag]: true;
	readonly Ctor: new (anchor: Comment) => Committer<V>;
	readonly value: V;
}

export function commitWith<V>(Ctor: new (anchor: Comment) => Committer<V>, value: V): CommitWith<V> {
	return { [commitWithTag]: true, Ctor, value };
}

export function isCommitWith(value: unknown): value is CommitWith {
	return typeof value === 'object' && value !== null && commitWithTag in value;
}
