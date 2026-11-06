// --- render(): the public entry point, one call per container. ------------------------------------

import type { TemplateResult } from './html.js';
import { type Part, updateParts } from './parts.js';
import { getTemplate, instantiate } from './compile.js';

interface RenderedInstance {
	strings: TemplateStringsArray;
	parts: Part[];
}

const renderedInstances = new WeakMap<Element | DocumentFragment, RenderedInstance>();

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

	container.textContent = '';
	const { fragment, parts } = instantiate(getTemplate(result.strings, result.type));
	container.appendChild(fragment);
	// After connect so custom elements are upgraded before `.prop` bindings hit `@state()`/`@attribute()` accessors.
	updateParts(parts, result.values);
	renderedInstances.set(container, { strings: result.strings, parts });
}
