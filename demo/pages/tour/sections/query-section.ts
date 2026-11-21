// Demonstrates: `@query()`/`@queryAll()` (light-DOM selector accessors) and `firstUpdated()` +
// `this.effect()` for imperatively patching a node outside the template's own re-render.
import { tag, t, UIElement, state, query, queryAll } from '@std-ui/core';

@tag('demo-query-section')
export class DemoQuerySection extends UIElement {
	readonly items = state(['alpha', 'beta', 'gamma']);

	@query('input') input!: HTMLInputElement | null;
	@queryAll('li') listItems!: NodeListOf<HTMLLIElement>;

	protected override template() {
		return t`
			<h2>Queries</h2>
			<p class="desc"><code>@query()</code> / <code>@queryAll()</code> resolve <code>this.querySelector(All)</code> on demand; <code>firstUpdated()</code> + <code>this.effect()</code> patch a node (the <code>.badge</code> span) directly.</p>
			<input class="demo-outlined-field" type="text" placeholder="add an item, press Enter" @keydown=${(e: KeyboardEvent) => this.#onKeydown(e)} />
			<span class="demo-badge badge"></span>
			<ul>
				${this.items().map(item => t`<li>${item}</li>`)}
			</ul>
			<div class="demo-actions">
				<button type="button" @click=${() => this.input?.focus()}>focus input via @query</button>
				<button type="button" class="tonal" @click=${() => console.log('@queryAll() <li> count:', this.listItems.length)}>log &lt;li&gt; count (console)</button>
			</div>
		`;
	}

	protected override firstUpdated(): void {
		const badge = this.querySelector('.badge') as HTMLElement;
		this.effect(() => {
			const n = this.items().length;
			badge.textContent = `${n} item${n === 1 ? '' : 's'}`;
		});
	}

	#onKeydown(e: KeyboardEvent): void {
		if (e.key !== 'Enter') return;
		const value = this.input?.value.trim();
		if (!value) return;
		this.items.set([...this.items(), value]);
		if (this.input) this.input.value = '';
	}
}
