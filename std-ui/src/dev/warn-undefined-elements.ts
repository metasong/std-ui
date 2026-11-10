const RESERVED_HYPHEN_TAGS = new Set([
	'annotation-xml', 'color-profile', 'font-face', 'font-face-src', 'font-face-uri',
	'font-face-format', 'font-face-name', 'missing-glyph',
]);

/** Dev aid: a custom-element tag used in a template whose class was never imported (so never
 *  `customElements.define`d) silently renders as an inert `HTMLElement`. After a grace period
 *  (imports may legitimately register later, e.g. lazy modules) warn with a fix hint. */
export function warnOnUndefinedElements(root: DocumentFragment): void {
	if (typeof customElements === 'undefined') return;
	const tags = new Set<string>();
	for (const el of Array.from(root.querySelectorAll('*'))) {
		const name = el.localName;
		if (name.includes('-') && !RESERVED_HYPHEN_TAGS.has(name) && !customElements.get(name)) tags.add(name);
	}
	if (tags.size === 0) return;
	setTimeout(() => {
		for (const name of tags) {
			if (customElements.get(name)) continue;
			console.warn(
				`std-ui html: <${name}> is used in a template but is not a defined custom element. ` +
					`It will render as an inert element. Did you forget to import the module that declares ` +
					`it (the one with @tag('${name}'))? Add a side-effect import, e.g. ` +
					`import './path/to/${name}.js';`,
			);
		}
	}, 1000);
}
