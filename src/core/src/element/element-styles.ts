// `UIElement`'s `static styles` support (see its doc comment in `ui-element.ts` for the full
// picture) - split out here since it's a self-contained concern: applying a `CSSResultGroup` to a
// render root, and keeping it applied across re-renders.
//
// - Shadow root with `adoptedStyleSheets` support: adopts the (shared, cached) `CSSStyleSheet`s
//   directly - cheap, and naturally scoped by the shadow boundary, so `:host` is left as-is.
// - Shadow root without `adoptedStyleSheets` support (e.g. some test DOMs): a plain per-instance
//   `<style>` - still contained by the shadow boundary, so no `@scope` wrapping needed.
// - Light DOM: adopted **once per custom element tag**, onto `document` (or onto the enclosing shadow
//   root, when the element is rendered inside another component's shadow tree) - not the render root -
//   wrapped in `@scope (tag-name) { ... }` so it only ever matches this tag's elements; `:host`
//   is rewritten to `:scope` first so the same literal reads the same way as the shadow-DOM case.
//   One shared sheet per tag (not per instance) avoids re-parsing identical CSS for every instance.

import {
	flattenCSSResults,
	flattenCSSText,
	hostSelectorsToScope,
	type CSSResultGroup,
} from './template/index.js';

/**
 * One instance per `UIElement`, created alongside its render root. Holds the one piece of state
 * styling needs to track across re-renders - the shadow-fallback `<style>`, if any (see `apply()`)
 * - so `UIElement` itself doesn't have to.
 */
export class ElementStyles {
	/** Per root (`document`, or a shadow root hosting light-DOM elements), the tag names whose `static styles`
	 *  were already adopted there - shared across every `ElementStyles` instance (static, not per-instance) so
	 *  every instance of a light-DOM-rendering class after the first in that root is a no-op; custom element tag
	 *  names are globally unique, so this also can't collide across classes. Weak, so a removed shadow root
	 *  takes its entry with it. */
	static #styledTagNames = new WeakMap<Document | ShadowRoot, Set<string>>();

	/** The `<style>` inserted for the shadow-root-without-`adoptedStyleSheets` fallback (see `apply()`) -
	 *  `render()` clears the render root's children on structural re-renders, so this is tracked here and
	 *  re-inserted by `reinsertIfRemoved()` after each render. `null` otherwise (no styles, `adoptedStyleSheets`
	 *  used, or light DOM - whose styles live on `document`, which `render()` clearing the render root can't
	 *  touch). */
	#styleElement: HTMLStyleElement | null = null;

	/** Applies `styles` (if any) to `renderRoot`, once. */
	apply(renderRoot: Element | DocumentFragment, tagName: string, styles: CSSResultGroup | undefined): void {
		if (!styles) return;

		if (renderRoot instanceof ShadowRoot) {
			if (Array.isArray(renderRoot.adoptedStyleSheets)) {
				const sheets = flattenCSSResults(styles);
				const existing = renderRoot.adoptedStyleSheets;
				const toAdd = sheets.filter(sheet => !existing.includes(sheet));
				if (toAdd.length) renderRoot.adoptedStyleSheets = [...existing, ...toAdd];
				return;
			}

			const style = document.createElement('style');
			style.textContent = flattenCSSText(styles);
			this.#styleElement = style;
			renderRoot.prepend(style);
			return;
		}

		// Document sheets don't reach into a shadow tree, so a light-DOM element rendered inside another
		// component's shadow root needs its sheet on that root; everywhere else it goes on the document.
		const rootNode = renderRoot.getRootNode();
		const target: Document | ShadowRoot = rootNode instanceof ShadowRoot ? rootNode : document;

		let styledTagNames = ElementStyles.#styledTagNames.get(target);
		if (!styledTagNames) ElementStyles.#styledTagNames.set(target, styledTagNames = new Set());
		if (styledTagNames.has(tagName)) return;
		styledTagNames.add(tagName);

		const scopedCssText = `@scope (${tagName}) {\n${hostSelectorsToScope(flattenCSSText(styles))}\n}`;
		if (Array.isArray(target.adoptedStyleSheets)) {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(scopedCssText);
			target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
		} else {
			const style = document.createElement('style');
			style.textContent = scopedCssText;
			(target instanceof ShadowRoot ? target : document.head).appendChild(style);
		}
	}

	/**
	 * Re-inserts the shadow-fallback `<style>` (if any) into `renderRoot` when a structural re-render (`render()`
	 * clearing the render root's children) removed it - `render()` only clears on the *first* render of a given
	 * `template()` literal, or when it changes to a different one, so this is a no-op on the (much more common)
	 * value-only updates, and whenever `apply()` didn't need to track anything in the first place.
	 */
	reinsertIfRemoved(renderRoot: Element | DocumentFragment): void {
		if (this.#styleElement && !this.#styleElement.isConnected) renderRoot.prepend(this.#styleElement);
	}
}
