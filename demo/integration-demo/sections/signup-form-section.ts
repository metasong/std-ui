// Integration: one <form> mixing a native control, a plain FormElement and a FormGroup, all bound to the
// same `state` model whose validators drive every control's constraint validation.
//   - native <input>         → formBind() mirrors errors via setCustomValidity
//   - FormElement (merged)   → first/last errors unioned into the host's single validity state
//   - FormGroup (range)      → each property's errors routed to its own inner input
// The browser's own submit validation then blocks the submit while any control is invalid.
import { bind, css, t, tag, UIElement, state } from '../../../core/src/index.js';
import { check, formBind, formUi, required, email } from '../../../ext/src/index.js';
import '../../feature-demo/sections/bind/validation/merged-control.js';
import '../../feature-demo/sections/bind/validation/range-control.js';

const model = state({ email: '', first: '', last: '', start: '', end: '' }).with(check).with(formUi);
model.email.check.validators.set([required('Email is required'), email('Not a valid email')]);
model.first.check.validators.set([required('First name required')]);
model.last.check.validators.set([required('Last name required')]);
model.start.check.validators.set([required('Start required')]);
model.end.check.validators.set([
	required('End required'),
	v => (!v || !model.start() || String(v) >= String(model.start()) ? undefined : { flag: 'rangeUnderflow' as const, message: 'End is before start' }),
]);

@tag('demo-integration-signup')
export class DemoIntegrationSignup extends UIElement {
	static override styles = css`
		input:read-only:not([type='checkbox']):not([type='radio']),
		textarea:read-only {
			background-color: var(--md-sys-color-surface-container-high);
			color: var(--md-sys-color-on-surface-variant);
		}

		input:disabled:not([type='checkbox']):not([type='radio']),
		textarea:disabled {
			opacity: 0.65;
			cursor: not-allowed;
		}

		.demo-form-toggles {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem 1rem;
			margin: 0.5rem 0 0;
			font-size: 0.875rem;
		}

		.demo-form-toggles label {
			display: inline-flex;
			align-items: center;
			gap: 0.35rem;
		}
	`;

	readonly submitted = state('');

	#submit(e: Event): void {
		e.preventDefault();
		model.formUi.touchAll();
		this.submitted.set(JSON.stringify(model(), null, 2));
	}

	#reset(): void {
		model.email.set('');
		model.first.set('');
		model.last.set('');
		model.start.set('');
		model.end.set('');
		model.formUi.untouchAll();
		this.submitted.set('');
	}

	protected override template() {
		const errors = model.check.allErrors();
		return t`
			<section class="demo-bind-block" id="signup">
				<h2>Sign-up form: binding + validation + form elements</h2>
				<p class="desc">
					One model, three kinds of control. Press <em>Submit</em> with empty fields: the browser blocks the
					submit and points at the first invalid control. Errors show on a control once it has been touched.
				</p>

				<form @submit=${(e: Event) => this.#submit(e)}>
					<label class="demo-bind-field">
						Email (native input)
						<input type="text" .value=${formBind(model.email)} title=${model.email.check.errors().map(e => e.message).join('\n')} />
					</label>

					<p class="desc">Name (<code>FormElement</code>, errors merged into one state)</p>
					<demo-bind-merged .first=${formBind(model.first)} .last=${formBind(model.last)}></demo-bind-merged>

					<p class="desc">Stay (<code>FormGroup</code>, errors routed to each inner input)</p>
					<demo-bind-range .start=${formBind(model.start)} .end=${formBind(model.end)}></demo-bind-range>

					<div class="demo-actions">
						<button type="submit">Submit</button>
						<button type="button" class="tonal" @click=${() => this.#reset()}>Reset model</button>
					</div>
					<p class="demo-form-toggles">
						<label><input type="checkbox" .checked=${bind(model.formUi.readonly.own)} /> Read-only (<code>formUi.readonly.own</code>)</label>
						<label><input type="checkbox" .checked=${bind(model.formUi.disabled.own)} /> Disable form (<code>formUi.disabled.own</code>)</label>
					</p>
				</form>

				<p class="demo-bind-mirror">Model valid: <code>${String(model.check.allValid())}</code></p>
				<pre class="demo-bind-mirror">${errors.length ? errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n') : 'No errors'}</pre>
				<pre class="demo-bind-mirror">${this.submitted() || 'Nothing submitted yet.'}</pre>
			</section>
		`;
	}
}
