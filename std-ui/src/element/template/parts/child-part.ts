import { isTemplateResult } from '../html/index.js';
import {
	applyDirective,
	isDirectiveResult,
	noChange,
	PartType,
	type ChildPartInfo,
	type Directive,
} from '../directive.js';
import type { Part } from './part.js';
import {
	isCommitWith,
	ListCommitter,
	TemplateCommitter,
	TextCommitter,
	type Committer,
	type CommitterClass,
} from './committers/index.js';

/** Maps a resolved (post-directive) value to the committer class that handles it, plus the value
 *  that committer expects; `undefined` means "render nothing". */
function pickCommitter(value: unknown): { Ctor: CommitterClass; value: unknown } | undefined {
	if (isCommitWith(value)) return { Ctor: value.Ctor, value: value.value };
	if (Array.isArray(value)) return { Ctor: ListCommitter, value };
	if (isTemplateResult(value)) return { Ctor: TemplateCommitter, value };
	if (value == null || value === false) return undefined;
	return { Ctor: TextCommitter, value: String(value) };
}

/** Binds a child-content position, anchored by a persistent comment node (`anchor`) in the DOM. */
export class ChildPart implements Part {
	readonly valueCount = 1;
	#committer: Committer<any> | undefined;
	/** The `Directive` instance bound here, if a `directive()`-made value (e.g. `html()`) was
	 *  ever applied to this position; reused across renders - see `directive.ts`. */
	#directive: Directive | undefined;
	/** This position's `ChildPartInfo`, built once and handed to directives - see `directive.ts`. */
	#partInfo: ChildPartInfo;
	constructor(private readonly anchor: Comment, private readonly host?: unknown) {
		this.#partInfo = { type: PartType.CHILD, anchor };
	}

	/** The comment marking the end of this part's content. @internal */
	get endNode(): Comment {
		return this.anchor;
	}

	update(values: readonly unknown[]): void {
		let value = values[0];
		if (!isDirectiveResult(value)) this.#disconnectDirective();
		else {
			const { instance, value: resolved } = applyDirective(this.#partInfo, value, this.#directive);
			this.#directive = instance;
			if (resolved === noChange) return;
			value = resolved;
		}
		const picked = pickCommitter(value);
		if (!picked) {
			this.#clear();
			return;
		}
		if (this.#committer?.constructor === picked.Ctor && this.#committer.update(picked.value)) return;
		this.#clear();
		this.#committer = new picked.Ctor(this.anchor, this.host);
		this.#committer.update(picked.value);
	}

	#clear(): void {
		this.#committer?.dispose();
		this.#committer = undefined;
	}

	#disconnectDirective(): void {
		this.#directive?.disconnected();
		this.#directive = undefined;
	}

	/** Runs `disconnected()` on this part's directive and on directives in its nested content,
	 *  leaving the DOM untouched (so a detached element keeps its last rendered output). */
	disconnect(): void {
		this.#disconnectDirective();
		this.#committer?.disconnect();
	}

	/** Removes this part's content and its anchor. @internal */
	dispose(): void {
		this.#disconnectDirective();
		this.#clear();
		this.anchor.remove();
	}
}
