// --- render(): the public entry point, one call per container. ------------------------------------

import type { TemplateResult } from './html.js';
import type { Part } from './parts.js';
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
		for (let i = 0; i < previous.parts.length; i++) previous.parts[i].update(result.values[i]);
		return;
	}

	container.textContent = '';
	const { fragment, parts } = instantiate(getTemplate(result.strings));
	for (let i = 0; i < parts.length; i++) parts[i].update(result.values[i]);
	container.appendChild(fragment);
	renderedInstances.set(container, { strings: result.strings, parts });
}
