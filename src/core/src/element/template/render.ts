// --- render(): the public entry point. ------------------------------------------------------------

import type { TemplateResult } from './tag-funcs/html/index.js';
import { type Part, updateParts } from './parts/index.js';
import { getTemplate, instantiate } from './factory/index.js';
import { DEV } from '../../dev/flag.js';

export interface RenderOptions {
	/** `this` for `@event` handlers and callback `ref()`s in the rendered template (default: the element). */
	host?: unknown;
	/**
	 * Render *at a position* instead of taking the container over: before this child of the container (`null`: at the
	 * end). Existing children are kept, and `dispose()` of the returned handle removes only the rendered nodes. Omit it
	 * for the usual one-template-per-container `render()`.
	 */
	before?: Node | null;
}

/** What `render()` returns: update or remove the rendered template. */
export interface Rendered {
	/** Renders `result` here: values of the same call site are patched in place, another template replaces the DOM. */
	update(result: TemplateResult): void;
	/** Disposes the bound parts and removes what was rendered (the whole content when the container was taken over). */
	dispose(): void;
}

type Container = Element | DocumentFragment;

/**
 * One rendered template in a container. Two flavours, told apart by `end`:
 *  - no `end`: the slot owns the whole container (its content is replaced, `dispose()` empties it);
 *  - `end`: a hidden comment that marks the position next to children owned by someone else (nothing is cleared,
 *    `dispose()` removes only this slot's nodes and the marker).
 */
class Slot implements Rendered {
	#strings?: TemplateStringsArray;
	#parts: Part[] = [];
	#nodes: ChildNode[] = [];
	#disposed = false;

	constructor(
		private readonly container: Container,
		private readonly host: unknown,
		private readonly end?: Comment,
	) {}

	update(result: TemplateResult): void {
		// A slot updated after `dispose()` could not be found again (`unmount()`, the next `render()`): its DOM would leak.
		if (this.#disposed) {
			throw new Error(DEV ? 'render(): update() was called after dispose(); call render() again to get a new handle' : 'render: update after dispose');
		}
		if (this.#strings === result.strings) {
			updateParts(this.#parts, result.values);
			return;
		}
		this.#teardown();
		const { fragment, parts } = instantiate(getTemplate(result.strings, result.type), this.host);
		this.#nodes = [...fragment.childNodes];
		if (this.end) {
			// the marker may have been moved or removed by someone else: then append
			this.container.insertBefore(fragment, this.end.parentNode === this.container ? this.end : null);
		} else {
			this.container.textContent = '';
			this.container.appendChild(fragment);
		}
		// Registered before the first `updateParts`: the fragment is already in the DOM, so if a binding
		// throws, the next `update()`/`dispose()` must still find these parts to dispose them.
		this.#strings = result.strings;
		this.#parts = parts;
		// After connect so custom elements are upgraded before `.prop` bindings forward into `store()`/`@attribute()` stores.
		updateParts(parts, result.values);
	}

	/** Runs the bound directives' `disconnected()` and leaves the DOM as-is. */
	disconnect(): void {
		for (const part of this.#parts) part.disconnect?.();
	}

	dispose(): void {
		this.#disposed = true;
		this.#teardown();
		if (this.end) {
			this.end.remove();
		} else {
			slots.delete(this.container);
			this.container.textContent = '';
		}
	}

	#teardown(): void {
		this.disconnect();
		// `disconnect()` only releases directives; `dispose()` also lets renderers release what they own beyond
		// the DOM that is removed below (list/keyed rows, `virtualize` controllers and observers, `cache()` entries).
		for (const part of this.#parts) part.dispose?.();
		for (const node of this.#nodes) node.remove();
		this.#strings = undefined;
		this.#parts = [];
		this.#nodes = [];
	}
}

/** The slot of each container that `render()` took over. */
const slots = new WeakMap<Container, Slot>();

/**
 * Runs every bound directive's `disconnected()` for what `render()` last put in `container`,
 * leaving the DOM as-is. Used when the container's owner is detached (e.g. an element removed from
 * the document) and may be re-rendered later; directives are re-created on the next render.
 */
export function disconnectRendered(container: Container): void {
	slots.get(container)?.disconnect();
}

/**
 * Tears down whatever `render()` last put in `container`: runs every bound directive's
 * `disconnected()`, disposes the parts (renderers release rows, controllers, observers) and empties the container. Call this before discarding a container (e.g. when a
 * component is removed); `render()` also calls it when a different template replaces the old one.
 */
export function unmount(container: Container): void {
	const slot = slots.get(container);
	if (slot) slot.dispose();
	else container.textContent = '';
}

/**
 * Renders `result` into `container`, reusing the previous render's DOM/parts whenever `result` comes
 * from the same tagged-template call site (same `strings` identity) - per the usual tagged-template contract
 * that only *values* need to be diffed, not structure.
 *
 * Returns a handle to update or remove what was rendered (calling `render()` again also updates). By default the
 * container is taken over: its content is replaced, and `dispose()` is `unmount(container)`. With the `before` option
 * the template is rendered at a position next to the container's existing children instead, and `dispose()` removes
 * only its own nodes. Use it to place a template next to DOM that something else owns, e.g. after a heading of a
 * markdown doc:
 *
 *   const toc = render(t`<iam-toc .items=${items}></iam-toc>`, article, { before: title.nextSibling });
 *   toc.update(t`<iam-toc .items=${more}></iam-toc>`); // same call site: only `.items` is patched
 *   toc.dispose();
 */
export function render(result: TemplateResult, container: Container, options?: RenderOptions): Rendered {
	let slot: Slot;
	if (options?.before !== undefined) {
		const end = document.createComment('');
		container.insertBefore(end, options.before);
		slot = new Slot(container, options.host, end);
	} else {
		const existing = slots.get(container);
		slot = existing ?? new Slot(container, options?.host);
		if (!existing) slots.set(container, slot);
	}
	slot.update(result);
	return slot;
}