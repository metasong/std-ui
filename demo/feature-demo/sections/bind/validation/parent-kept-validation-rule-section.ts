// Validation rules kept on the PARENT, applied to its members:
//   check.eachValidators   one rule set for every member of an array / record-like object
//   check.fields({...})    rules per member key, in one call
// Existing and later-added members get them; each member reports its own errors and the parent's
// `valid` includes them.
import { t, tag, UIElement, state } from '@std-ui/core';
import { check, formBind, minLength, required } from '@std-ui/ext';

const form = state({
	tags: ['ab'] as string[],
	labels: { en: 'Hello', de: '' } as Record<string, string>,
	profile: { name: '', age: 5 },
}).with(check);

// eachValidators on an array: every tag, including ones added later.
form.tags.check.eachValidators.set([required<string>('Tag is empty'), minLength<string>(3)]);
// eachValidators on an object: every label (language), including languages added later.
form.labels.check.eachValidators.set([required<string>('Label is empty')]);
// fields: different rules per key, all kept on `profile` instead of on each member.
form.profile.check.fields({
	name: [required<string>('Name is required'), minLength<string>(3)],
	age: [v => (v >= 18 ? undefined : { flag: 'rangeUnderflow', message: 'Must be 18 or older' })],
});
let nextLang = 1;

type Node = { check: { errors(): { message: string }[] } };
/** One sub-demo: a titled box, so each feature reads as its own group. */
const card = (title: string, hint: string, body: unknown) => t`
	<div style="border: 1px solid var(--outline, #cfcfcf); border-radius: 8px; padding: 12px 16px; margin: 12px 0">
		<div style="font-weight: 600">${title}</div>
		<small style="opacity: .6; display: block; margin-bottom: 8px">${hint}</small>
		${body}
	</div>
`;
const fieldError = (node: Node) =>
	t`<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">${node.check.errors()[0]?.message ?? ''}</small>`;

@tag('demo-bind-parent-kept-validation-rule-section')
export class DemoBindParentKeptValidationRuleSection extends UIElement {
	protected override template() {
		const all = form.tags.check.valid() && form.labels.check.valid() && form.profile.check.valid();
		return t`
			<section class="demo-bind-block" id="parent-kept-validation-rule">
				<h2>Rules kept on the parent</h2>

				${card('array.check.eachValidators', 'Every tag needs 3+ characters, also new ones.', t`
				${form.tags.deep().map((_, i) => t`
					<label class="demo-bind-field">
						Tag ${i + 1}
						<input type="text" .value=${formBind(form.tags.at(i)!)} />
						<button type="button" class="tonal" @click=${() => form.tags.splice(i, 1)}>remove</button>
					</label>
					${fieldError(form.tags.at(i)!)}
				`)}
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${() => form.tags.push('')}>add tag</button>
				</div>`)}

				${card('object.check.eachValidators', 'Every label is required, also new languages.', t`
				${Object.keys(form.labels.deep()).map(key => t`
					<label class="demo-bind-field">
						${key}
						<input type="text" .value=${formBind(form.labels[key])} />
					</label>
					${fieldError(form.labels[key])}
				`)}
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${() => form.labels.set({ [`lang${nextLang++}`]: '' })}>add language</button>
				</div>`)}

				${card('object.check.fields', 'A different rule per key, set in one call.', t`
				<label class="demo-bind-field">
					Name
					<input type="text" .value=${formBind(form.profile.name)} />
				</label>
				${fieldError(form.profile.name)}
				<label class="demo-bind-field">
					Age
					<input type="number" .value=${formBind(form.profile.age)} />
				</label>
				${fieldError(form.profile.age)}`)}

				<div class="demo-actions">
					<button type="button" ?disabled=${!all}>Save</button>
				</div>
			</section>
		`;
	}
}
