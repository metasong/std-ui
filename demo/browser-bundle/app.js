// App entry — a classic script using the `StdUI` global from the prebuilt IIFE bundle
// (`../core/dist/browser/std-ui-core.iife.min.js`, loaded first in index.html; run `npm run build` first).
(() => {
	const { state, computed, effect, t, render, UIElement, classMap } = StdUI;

	// --- Inline render (no custom element) -----------------------------------------------------

	const inlineCount = state(0);
	const inlineLabel = computed(() => (inlineCount() === 1 ? 'click' : 'clicks'));

	function inlineView() {
		return t`
			<p class="metric"><strong>${inlineCount()}</strong> ${inlineLabel()}</p>
			<div class="actions">
				<button
					type="button"
					class=${classMap({ primary: true })}
					@click=${() => inlineCount.update((n) => n + 1)}
				>+1</button>
				<button
					type="button"
					@click=${() => inlineCount.set(0)}
					?disabled=${inlineCount() === 0}
				>reset</button>
			</div>
		`;
	}

	const inlineRoot = document.getElementById('inline-root');
	effect(() => {
		render(inlineView(), inlineRoot);
	});

	// --- Custom element (decorator-free equivalent of @tag + UIElement) ------------------------

	const count = state(0);
	const label = computed(() => (count() === 1 ? 'click' : 'clicks'));

	class BrowserBundleCounter extends UIElement {
		template() {
			return t`
				<p class="metric"><strong>${count()}</strong> ${label()}</p>
				<div class="actions">
					<button type="button" class="primary" @click=${() => count.update((n) => n + 1)}>+1</button>
					<button type="button" @click=${() => count.set(0)} ?disabled=${count() === 0}>reset</button>
				</div>
			`;
		}
	}

	customElements.define('browser-bundle-counter', BrowserBundleCounter);
})();
