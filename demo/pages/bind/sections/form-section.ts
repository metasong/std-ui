// Two-way bind on native form controls: .value, .checked, programmatic reset, re-render while typing.
import { bind, t, tag, UIElement, state } from '@std-ui/core';

@tag('demo-bind-form-section')
export class DemoBindFormSection extends UIElement {
	readonly search = state('hello');
	readonly agreed = state(false);
	readonly renderPasses = state(0);

	protected override template() {
		return t`
			<section class="demo-bind-block" id="form">
				<h2>Native form controls</h2>
				<p class="desc">
					<code>bind()</code> replaces <code>.value</code> + <code>@input</code>. Edits update the
					bound signal; other re-renders should not stomp the field while values stay in sync.
				</p>
				<label class="demo-bind-field">
					Text
					<input .value=${bind(this.search)} type="text" />
				</label>
				<p class="demo-bind-mirror">Model: <code>${this.search()}</code></p>
				<label class="demo-bind-field demo-bind-field--inline">
					<input type="checkbox" .checked=${bind(this.agreed)} />
					I agree
				</label>
				<p class="demo-bind-mirror">Agreed: <code>${String(this.agreed())}</code></p>
				<div class="demo-actions">
					<button type="button" @click=${() => this.search.set('')}>clear query from model</button>
					<button type="button" class="tonal" @click=${() => this.renderPasses.update(n => n + 1)}>
						bump render counter (${this.renderPasses()})
					</button>
				</div>
			</section>
		`;
	}
}
