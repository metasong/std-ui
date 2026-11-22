// Conditional validation in a small order form. Nothing to read: click the switches and watch the
// errors and the Submit button react.
//   VAT        when(isCompany, ...)             rules apply only for companies
//   Email      check.enabled                    validated only while "Notify me" is on
//   Address    formUi.disabled                  a disabled input is not validated
// All three are configured in one call with `form.check.fields({...})`.
import { t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import { check, formBind, formUi, minLength, pattern, required, when } from '@std-ui/ext';

const form = stateTree({ vat: '', email: '', address: '' }).with(check).with(formUi);
const isCompany = stateTree(false);

// FEATURE 4: check.fields({...}) sets the rules of several members in one call (here for all
// three fields), instead of `form.vat.check.validators.set(...)` for each.
form.check.fields({
	// FEATURE 1: when(condition, validators). The rules run only while `condition()` is true; any
	// signal or `() => boolean` works. Flipping it re-evaluates errors / valid automatically.
	vat: [
		when(isCompany, [
			required<string>('VAT number is required'),
			minLength<string>(8),
			pattern(/^[A-Z]{2}/, 'Must start with 2 capital letters, e.g. DE123456789'),
		]),
	],
	// FEATURE 2 (below): node.check.enabled switches ALL of one node's own validators on/off.
	email: [required<string>('Email is required'), pattern(/@/, 'Not an email address')],
	address: [required<string>('Address is required')],
});
form.email.check.enabled.set(false); // off until "Notify me" is ticked

// FEATURE 3: formUi.disabled. A node disabled in its form UI (or under a disabled parent) is not
// validated, like a native disabled input. No extra wiring: `check` follows the flag.
form.address.formUi.disabled.own.set(true);
type Node = { check: { errors(): { message: string }[] } };
const error = (node: Node) => node.check.errors()[0]?.message ?? '';

const toggle = (label: string, checked: boolean, onChange: (on: boolean) => void) =>
	t`<label class="demo-bind-field"><input type="checkbox" .checked=${checked} @change=${(e: Event) => onChange((e.target as HTMLInputElement).checked)} /> ${label}</label>`;

/** One sub-demo: a titled box, so each feature reads as its own group. */
const card = (title: string, hint: string, body: unknown) => t`
	<div style="border: 1px solid var(--outline, #cfcfcf); border-radius: 8px; padding: 12px 16px; margin: 12px 0">
		<div style="font-weight: 600">${title}</div>
		<small style="opacity: .6; display: block; margin-bottom: 8px">${hint}</small>
		${body}
	</div>
`;

const fieldError = (node: Node) => t`<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">${error(node)}</small>`;

@tag('demo-bind-conditional-section')
export class DemoBindConditionalSection extends UIElement {
	protected override template() {
		return t`
			<section class="demo-bind-block" id="conditional">
				<h2>Conditional validation</h2>

				${card('when()', 'VAT rules apply only to companies. Switch the type.', t`
				<div class="demo-actions">
					<button type="button" class=${isCompany() ? '' : 'tonal'} @click=${() => isCompany.set(false)}>Personal</button>
					<button type="button" class=${isCompany() ? 'tonal' : ''} @click=${() => isCompany.set(true)}>Company</button>
				</div>
				<label class="demo-bind-field">
					VAT number${isCompany() ? ' *' : ''}
					<input type="text" .value=${formBind(form.vat)} />
				</label>
				${fieldError(form.vat)}`)}

				${card('check.enabled', 'Email is checked only while this is on.', t`
				${toggle('Notify me by email', form.email.check.enabled(), on => form.email.check.enabled.set(on))}
				<label class="demo-bind-field">
					Email
					<input type="text" .value=${formBind(form.email)} />
				</label>
				${fieldError(form.email)}`)}

				${card('formUi.disabled', 'A disabled input is not validated.', t`
				${toggle('Ship to another address', !form.address.formUi.disabled.own(), on => form.address.formUi.disabled.own.set(!on))}
				<label class="demo-bind-field">
					Address
					<input type="text" .value=${formBind(form.address)} />
				</label>
				${fieldError(form.address)}`)}

				<div class="demo-actions">
					<button type="button" ?disabled=${!form.check.valid()}>Submit</button>
				</div>
			</section>
		`;
	}
}
