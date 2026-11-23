// --- Generic template Builder -----------------------------------------------------------------------
//
// Knows only generic concepts: a tagged template (`strings` + interpolations), the markup between
// them, *tags* / *attributes*, a parsed `<template>` element, and cloning it. It knows nothing about
// sigils (`.`/`?`/`@`), event modifiers, parts, SVG, or dev warnings - every such decision is
// delegated to `BuilderHooks`.
//
// Split by concern:
//   types.ts            contract: descriptors, hook contexts, hooks, public types (+ lifecycle doc)
//   markup-scanner.ts   strings -> markup with markers + descriptors
//   resolve-indices.ts  parsed markup -> descriptor `nodeIndex`, placeholder stripping
//   builder.ts          orchestration (index.ts is the folder's public surface): cache, build, instantiate

import { createMarkupScanner } from './markup-scanner.js';
import { resolveIndices } from './resolve-indices.js';
import type { Builder, BuilderHooks, BuilderOptions, SlotDescriptor, Template } from './types.js';

export function createBuilder<D extends SlotDescriptor, Part, Type extends string, Open = unknown>(
	hooks: BuilderHooks<D, Part, Type, Open>,
	options: BuilderOptions<Type>,
): Builder<D, Part, Type> {
	const marker = options.marker ?? 'std-ui-part';
	const scanMarkup = createMarkupScanner(hooks, marker);
	const cache = new WeakMap<TemplateStringsArray, Partial<Record<Type, Template<D>>>>();

	function build(strings: TemplateStringsArray, type: Type): Template<D> {
		// Running example: t`<p class="a ${x}" title="e${y}f${z}g" ${d}>Hi ${w}!</p>`

		// Step 1: join the strings, replacing each interpolation with a marker (see markup-scanner.ts).
		const { markup, descriptors } = scanMarkup(strings, options.foreignTypes?.includes(type) ?? false);

		// Step 2: parse the markup (optionally wrapped, e.g. in `<svg>`, so nodes get the right namespace).
		const element = document.createElement('template');
		element.innerHTML = hooks.wrapMarkup ? hooks.wrapMarkup(markup, type) : markup;

		// Step 3: remove the wrapper again, so node indices match the unwrapped markup.
		hooks.unwrapContent?.(element.content, type);

		// Step 4: give each descriptor its `nodeIndex` and strip placeholder attributes
		// (see resolve-indices.ts). Text-slot comments are kept as anchors.
		resolveIndices(element.content, descriptors, marker);

		// Step 5: the finished template. `instantiate` clones `element.content` and uses each `nodeIndex`
		// to find the node for its part.
		const template: Template<D> = { element, parts: descriptors };
		hooks.onBuilt?.(template, type);
		return template;
	}

	return {
		/**
		 * @param strings The tagged template's `strings` array. The same call site always passes the
		 *   same array object, so it is the cache key (a `WeakMap`, entries go away with it).
		 * @param type How to parse the markup (e.g. `'html'` or `'svg'`), defaults to `options.defaultType`.
		 *   The same `strings` can be built once per type, so the cache is `strings` -> `type` -> template.
		 */
		getTemplate(strings, type = options.defaultType) {
			let byType = cache.get(strings);
			if (!byType) {
				byType = {};
				cache.set(strings, byType);
			}
			return (byType[type] ??= build(strings, type));
		},

		instantiate(template, host) {
			const fragment = template.element.content.cloneNode(true) as DocumentFragment;
			const nodes: Node[] = [];
			const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
			let node: Node | null;
			let i = 0;
			while ((node = walker.nextNode())) nodes[i++] = node;

			const parts = template.parts.map(d => hooks.createPart(d, nodes[d.nodeIndex], host));
			hooks.onInstantiated?.(fragment, parts);
			return { fragment, parts };
		},
	};
}
