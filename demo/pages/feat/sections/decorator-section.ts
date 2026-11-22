// Class-level attachment: `@hotkeys()` (built on `UIFeat.attachTo`) gives every instance its own feature.
import { css, t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import { hotkeys } from '@std-ui/ext';

@tag('demo-feat-counter')
@hotkeys({
	ArrowUp: (e) => (e.currentTarget as DemoFeatCounter).count.update((n) => n + 1),
	ArrowDown: (e) => (e.currentTarget as DemoFeatCounter).count.update((n) => n - 1),
})
export class DemoFeatCounter extends UIElement {
	static override styles = css`div:focus { outline: 2px solid currentColor; outline-offset: 2px; }`;
	readonly count = stateTree(0);

	protected override template() {
		return t`<div tabindex="0">count: <b>${this.count()}</b> <small>focus, then ArrowUp / ArrowDown</small></div>`;
	}
}

@tag('demo-feat-decorator-section')
export class DemoFeatDecoratorSection extends UIElement {
	protected override template() {
		return t`
			<section id="decorator">
				<h2>Decorator attachment</h2>
				<p class="desc">
					<code>@hotkeys()</code> calls <code>UIFeat.attachTo()</code>: each instance below gets its own feature,
					created on its first connect. The class body has no key-handling code.
				</p>
				<demo-feat-counter></demo-feat-counter>
				<demo-feat-counter></demo-feat-counter>
			</section>
		`;
	}
}
