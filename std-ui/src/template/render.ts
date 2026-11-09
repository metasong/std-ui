// --- render(): the public entry point, one call per container. ------------------------------------

import type { TemplateResult } from './html.js';
import { type Part, updateParts } from './parts/index.js';
import { getTemplate, instantiate } from './compile.js';

interface RenderedInstance {
	strings: TemplateStringsArray;
	parts: Part[];
}

const renderedInstances = new WeakMap<Element | DocumentFragment, RenderedInstance>();

/**
 * Runs every bound directive's `disconnected()` for what `render()` last put in `container`,
 * leaving the DOM as-is. Used when the container's owner is detached (e.g. an element removed from
 * the document) and may be re-rendered later; directives are re-created on the next render.
 */
export function disconnectRendered(container: Element | DocumentFragment): void {
	const previous = renderedInstances.get(container);
	if (previous) for (const part of previous.parts) part.disconnect?.();
}

/**
 * Tears down whatever `render()` last put in `container`: runs every bound directive's
 * `disconnected()` and empties the container. Call this before discarding a container (e.g. when a
 * component is removed); `render()` also calls it when a different template replaces the old one.
 */
export function unmount(container: Element | DocumentFragment): void {
	disconnectRendered(container);
	renderedInstances.delete(container);
	container.textContent = '';
}

/**
 * Renders `result` into `container`, reusing the previous render's DOM/parts whenever `result` comes
 * from the same tagged-template call site (same `strings` identity) - matching lit-html's contract
 * that only *values* need to be diffed, not structure.
 */
export function render(result: TemplateResult, container: Element | DocumentFragment): void {
	const previous = renderedInstances.get(container);
	if (previous && previous.strings === result.strings) {
		updateParts(previous.parts, result.values);
		return;
	}

	unmount(container);
	const { fragment, parts } = instantiate(getTemplate(result.strings, result.type));
	container.appendChild(fragment);
	// After connect so custom elements are upgraded before `.prop` bindings forward into `@state()`/`@attribute()` stores.
	updateParts(parts, result.values);
	renderedInstances.set(container, { strings: result.strings, parts });
}
