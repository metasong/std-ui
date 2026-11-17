import { describe, expect, it } from 'vitest';
import { ElementStyles } from './element-styles.js';
import { css } from './template/tag-funcs/css/index.js';

describe('ElementStyles#apply', () => {
	it('is a no-op when styles is undefined', () => {
		const root = document.createElement('div');
		new ElementStyles().apply(root, 'el-noop', undefined);
		expect(root.children.length).toBe(0);
	});

	it('adopts styles onto a shadow root supporting adoptedStyleSheets, tracking nothing', () => {
		const host = document.createElement('div');
		const shadowRoot = host.attachShadow({ mode: 'open' });
		const styles = css`:host { color: red; }`;

		if (!Array.isArray(shadowRoot.adoptedStyleSheets)) return; // unsupported in this environment, see fallback test below

		const elementStyles = new ElementStyles();
		elementStyles.apply(shadowRoot, 'el-shadow-adopted', styles);
		expect(shadowRoot.adoptedStyleSheets).toContain(styles.styleSheet);

		// Nothing was tracked for this path, so re-insertion is a no-op.
		shadowRoot.textContent = '';
		expect(() => elementStyles.reinsertIfRemoved(shadowRoot)).not.toThrow();
		expect(shadowRoot.children.length).toBe(0);
	});

	it('falls back to a <style> child of the shadow root when adoptedStyleSheets is unsupported, tracking it', () => {
		const host = document.createElement('div');
		const shadowRoot = host.attachShadow({ mode: 'open' });
		const styles = css`.el-shadow-fallback-marker {}`;

		Object.defineProperty(shadowRoot, 'adoptedStyleSheets', { value: undefined, configurable: true });

		const elementStyles = new ElementStyles();
		elementStyles.apply(shadowRoot, 'el-shadow-fallback', styles);
		const style = shadowRoot.querySelector('style');
		expect(style).toBeTruthy();
		expect(style!.textContent).toContain('.el-shadow-fallback-marker');
	});

	it('adopts light-DOM styles onto document, scoped to the tag name, writing nothing into the render root', () => {
		const host = document.createElement('div');
		const styles = css`:host { color: blue; }`;

		new ElementStyles().apply(host, 'el-light-adopted', styles);
		expect(host.children.length).toBe(0); // never written into the render root itself

		const adopted = (document as unknown as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets;
		const cssText = Array.isArray(adopted)
			? adopted.flatMap(sheet => Array.from(sheet.cssRules)).map(rule => rule.cssText).join('\n')
			: Array.from(document.head.querySelectorAll('style')).map(style => style.textContent).join('\n');

		expect(cssText).toContain('@scope (el-light-adopted)');
		expect(cssText).toContain(':scope'); // :host rewritten for the @scope block
	});

	it('only adopts light-DOM styles once per tag name, even across different ElementStyles instances', () => {
		const styles = css`.el-light-once-marker {}`;
		new ElementStyles().apply(document.createElement('div'), 'el-light-once', styles);
		new ElementStyles().apply(document.createElement('div'), 'el-light-once', styles);

		const adopted = (document as unknown as { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets;
		const occurrences = Array.isArray(adopted)
			? adopted.filter(sheet => Array.from(sheet.cssRules).some(rule => rule.cssText.includes('el-light-once'))).length
			: Array.from(document.head.querySelectorAll('style')).filter(style => style.textContent?.includes('el-light-once')).length;

		expect(occurrences).toBe(1);
	});
});

describe('ElementStyles#reinsertIfRemoved', () => {
	it('is a no-op when nothing was tracked (styles undefined)', () => {
		const root = document.createElement('div');
		const elementStyles = new ElementStyles();
		elementStyles.apply(root, 'el-reinsert-noop', undefined);
		expect(() => elementStyles.reinsertIfRemoved(root)).not.toThrow();
	});

	it('re-inserts a tracked shadow-fallback <style> that was removed from the render root', () => {
		const host = document.createElement('div');
		const shadowRoot = host.attachShadow({ mode: 'open' });
		Object.defineProperty(shadowRoot, 'adoptedStyleSheets', { value: undefined, configurable: true });

		const elementStyles = new ElementStyles();
		elementStyles.apply(shadowRoot, 'el-reinsert', css`.el-reinsert-marker {}`);
		expect(shadowRoot.querySelector('style')).toBeTruthy();

		shadowRoot.textContent = ''; // simulate render() clearing the render root
		expect(shadowRoot.querySelector('style')).toBeNull();

		elementStyles.reinsertIfRemoved(shadowRoot);
		expect(shadowRoot.querySelector('style')).toBeTruthy();
	});
});
