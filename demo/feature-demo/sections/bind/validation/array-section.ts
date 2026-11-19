// Validating list items: `array.check.itemValidators` is one rule set for EVERY item, existing and
// added later. Each item reports its own errors, and the array's `valid` includes them.
import { t, tag, UIElement, state } from '@std-ui/core';
import { check, formBind, minLength, required } from '@std-ui/ext';

const form = state({ tags: ['ab'] as string[] }).with(check);

// One rule set for all tags, including ones added later.
form.tags.check.itemValidators.set([required<string>('Tag is empty'), minLength<string>(3)]);

@tag('demo-bind-array-section')
export class DemoBindArraySection extends UIElement {
	protected override template() {
		return t`
			<section class="demo-bind-block" id="array">
				<h2>List items</h2>
				<small style="opacity: .6; display: block">itemValidators: every tag needs 3+ characters, also new ones.</small>
				${form.tags.deep().map((_, i) => t`
					<label class="demo-bind-field">
						Tag ${i + 1}
						<input type="text" .value=${formBind(form.tags.at(i)!)} />
						<button type="button" class="tonal" @click=${() => form.tags.splice(i, 1)}>remove</button>
					</label>
					<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">${form.tags.at(i)!.check.errors()[0]?.message ?? ''}</small>
				`)}
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${() => form.tags.push('')}>add tag</button>
					<button type="button" ?disabled=${!form.tags.check.valid()}>Save</button>
				</div>
			</section>
		`;
	}
}
