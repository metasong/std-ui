import { Directive, directive, type DirectivePart, type PartInfo } from '../directive.js';
import { getTemplate, instantiate } from '../../compiler/index.js';
import { isTemplateResult, type TemplateResult } from '../../tag-funcs/html/index.js';
import { ChildRenderer, renderWith } from '../../parts/renderers/index.js';
import { PartType, updateParts, type Part } from '../../parts/part.js';
import { DEV } from '../../../../dev/flag.js';

interface Entry {
	parts: Part[];
	/** Holds the entry's nodes while it is not the active one. */
	stash: DocumentFragment;
}

/** Renders the current template, stashing the DOM + live parts of any template swapped out so
 *  switching back re-inserts it instead of re-instantiating. Non-template values render as text. */
class CacheRenderer extends ChildRenderer<unknown> {
	readonly #start = document.createComment('');
	readonly #entries = new Map<TemplateStringsArray, Entry>();
	#active: Entry | undefined;
	#activeStrings: TemplateStringsArray | undefined;
	#text: Text | undefined;

	constructor(anchor: Comment, host?: unknown) {
		super(anchor, host);
		anchor.before(this.#start);
	}

	update(value: unknown): boolean {
		if (isTemplateResult(value)) {
			const result = value as TemplateResult;
			if (this.#activeStrings !== result.strings) {
				this.#detach();
				let entry = this.#entries.get(result.strings);
				if (entry) {
					this.anchor.before(entry.stash);
				} else {
					const { fragment, parts } = instantiate(getTemplate(result.strings, result.type), this.host);
					this.anchor.before(fragment);
					entry = { parts, stash: document.createDocumentFragment() };
					this.#entries.set(result.strings, entry);
				}
				this.#active = entry;
				this.#activeStrings = result.strings;
			}
			updateParts(this.#active!.parts, result.values);
			return true;
		}
		this.#detach();
		if (value == null || value === false) return true;
		const str = String(value);
		if (this.#text) this.#text.data = str;
		else {
			this.#text = document.createTextNode(str);
			this.anchor.before(this.#text);
		}
		return true;
	}

	/** Moves everything between the markers into the active entry's stash and drops the text node. */
	#detach(): void {
		this.#text?.remove();
		this.#text = undefined;
		if (!this.#active) return;
		let n = this.#start.nextSibling;
		while (n && n !== this.anchor) {
			const next = n.nextSibling;
			this.#active.stash.append(n);
			n = next;
		}
		this.#active = undefined;
		this.#activeStrings = undefined;
	}

	override disconnect(): void {
		for (const e of this.#entries.values()) for (const p of e.parts) p.disconnect?.();
	}

	dispose(): void {
		this.disconnect();
		this.#detach();
		this.#entries.clear();
		this.#start.remove();
	}
}

class CacheDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error(DEV ? 'std-ui cache(): must be bound to a child position, not an attribute.' : 'cache(): child position only');
		}
	}

	override update(_part: DirectivePart, value: unknown) {
		return renderWith(CacheRenderer, value);
	}
}

/**
 * when a child binding
 * switches between templates, the DOM of the template switched out is kept and reused on the way
 * back, preserving its state (inputs, scroll, etc.) instead of rebuilding it.
 *
 *   t`${cache(loggedIn ? t`<x-home></x-home>` : t`<x-login></x-login>`)}`
 */
export const cache = directive(CacheDirective);
