// Conditional validation in a small order form. Nothing to read: click the switches and watch the
// errors and the Submit button react.
//   VAT        when(isCompany, ...)             rules apply only for companies
//   Email      check.enabled                    validated only while "Notify me" is on
//   Address    formUi.disabled                  a disabled input is not validated
import { t, tag, UIElement, state } from '@std-ui/core';
import { check, formBind, formUi, minLength, pattern, required, when } from '@std-ui/ext';

const form = state({ vat: '', email: '', address: '' }).with(check).with(formUi);
const isCompany = state(false);

// FEATURE 1: when(condition, validators). The rules run only while `condition()` is true; any
// signal or `() => boolean` works. Flipping it re-evaluates errors / valid automatically.
form.vat.check.validators.set([
	when(isCompany, [
		required<string>('VAT number is required'),
		minLength<string>(8),
		pattern(/^[A-Z]{2}/, 'Must start with 2 capital letters, e.g. DE123456789'),
	]),
]);

// FEATURE 2: node.check.enabled. A writable switch for ALL of one node's own validators.
// Off = no errors, not pending, counts as valid.
form.email.check.enabled.set(false);
form.email.check.validators.set([required<string>('Email is required'), pattern(/@/, 'Not an email address')]);

// FEATURE 3: formUi.disabled. A node disabled in its form UI (or under a disabled parent) is not
// validated, like a native disabled input. No extra wiring: `check` follows the flag.
form.address.formUi.disabled.own.set(true);
form.address.check.validators.set([required<string>('Address is required')]);

type Node = { check: { errors(): { message: string }[] } };
const error = (node: Node) => node.check.errors()[0]?.message ?? '';

const toggle = (label: string, checked: boolean, onChange: (on: boolean) => void) =>
	t`<label class="demo-bind-field"><input type="checkbox" .checked=${checked} @change=${(e: Event) => onChange((e.target as HTMLInputElement).checked)} /> ${label}</label>`;

const tip = (text: string) => t`<small style="opacity: .6; display: block">${text}</small>`;

const fieldError = (node: Node) => t`<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">${error(node)}</small>`;

@tag('demo-bind-conditional-section')
export class DemoBindConditionalSection extends UIElement {
	protected override template() {
		return t`
			<section class="demo-bind-block" id="conditional">
				<h2>Conditional validation</h2>

				${tip('when(): VAT rules apply only to companies. Switch type.')}
				<div class="demo-actions">
					<button type="button" class=${isCompany() ? '' : 'tonal'} @click=${() => isCompany.set(false)}>Personal</button>
					<button type="button" class=${isCompany() ? 'tonal' : ''} @click=${() => isCompany.set(true)}>Company</button>
				</div>
				<label class="demo-bind-field">
					VAT number${isCompany() ? ' *' : ''}
					<input type="text" .value=${formBind(form.vat)} />
				</label>
				${fieldError(form.vat)}

				${tip('check.enabled: email is checked only while this is on.')}
				${toggle('Notify me by email', form.email.check.enabled(), on => form.email.check.enabled.set(on))}
				<label class="demo-bind-field">
					Email
					<input type="text" .value=${formBind(form.email)} />
				</label>
				${fieldError(form.email)}

				${tip('formUi.disabled: a disabled input is not validated.')}
				${toggle('Ship to another address', !form.address.formUi.disabled.own(), on => form.address.formUi.disabled.own.set(!on))}
				<label class="demo-bind-field">
					Address
					<input type="text" .value=${formBind(form.address)} />
				</label>
				${fieldError(form.address)}

				<div class="demo-actions">
					<button type="button" ?disabled=${!form.check.valid()}>Submit</button>
				</div>
			</section>
		`;
	}
}
