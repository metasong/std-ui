import { isTemplateResult } from '../tag-funcs/html/index.js';
import { applyDirective, isDirectiveResult, noChange, type ChildPartInfo, type Directive } from '../directives/directive.js';
import { PartType } from './part.js';
import type { Part } from './part.js';
import {
	isRenderWith,
	ListRenderer,
	TemplateRenderer,
	TextRenderer,
	type ChildRenderer,
	type ChildRendererClass,
} from './renderers/index.js';

/** Maps a resolved (post-directive) value to the renderer class that handles it, plus the value
 *  that renderer expects; `undefined` means "render nothing". */
function pickRenderer(value: unknown): { Ctor: ChildRendererClass; value: unknown } | undefined {
	if (isRenderWith(value)) return { Ctor: value.Ctor, value: value.value };
	if (Array.isArray(value)) return { Ctor: ListRenderer, value };
	if (isTemplateResult(value)) return { Ctor: TemplateRenderer, value };
	if (value == null || value === false) return undefined;
	return { Ctor: TextRenderer, value: String(value) };
}

/** Binds a child-content position, anchored by a persistent comment node (`anchor`) in the DOM. */
export class ChildPart implements Part {
	readonly valueCount = 1;
	#renderer: ChildRenderer<any> | undefined;
	/** The `Directive` instance bound here, if a `directive()`-made value (e.g. `html()`) was
	 *  ever applied to this position; reused across renders - see `directives/directive.ts`. */
	#directive: Directive | undefined;
	/** This position's `ChildPartInfo`, built once and handed to directives - see `directives/directive.ts`. */
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
		const picked = pickRenderer(value);
		if (!picked) {
			this.#clear();
			return;
		}
		if (this.#renderer?.constructor === picked.Ctor && this.#renderer.update(picked.value)) return;
		this.#clear();
		this.#renderer = new picked.Ctor(this.anchor, this.host);
		this.#renderer.update(picked.value);
	}

	#clear(): void {
		this.#renderer?.dispose();
		this.#renderer = undefined;
	}

	#disconnectDirective(): void {
		this.#directive?.disconnected();
		this.#directive = undefined;
	}

	/** Runs `disconnected()` on this part's directive and on directives in its nested content,
	 *  leaving the DOM untouched (so a detached element keeps its last rendered output). */
	disconnect(): void {
		this.#disconnectDirective();
		this.#renderer?.disconnect();
	}

	/** Removes this part's content and its anchor. @internal */
	dispose(): void {
		this.#disconnectDirective();
		this.#clear();
		this.anchor.remove();
	}
}
