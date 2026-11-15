// bind() mirrors a state's validator errors into the element's constraint validation.
// Three targets: native controls, a plain FormElement (merged state) and a FormGroup (routed to inner controls).
import { bind, t, tag, UIElement, state } from '../../../../../std-ui/src/index.js';
import { check } from '../../../../../std-ui-ext/src/index.js';
import './range-control.js';
import './merged-control.js';

const required = (message: string) => (v: unknown) => (v ? undefined : { flag: 'valueMissing' as const, message });

const form = check(state({ name: '', age: 5 }));
form.name.check.validators.set([
	required('Name is required'),
	v => (String(v).length >= 3 ? undefined : { flag: 'tooShort', message: 'At least 3 characters' }),
]);
form.age.check.validators.set([
	v => (v >= 2 && v <= 8 ? undefined : { flag: 'rangeOverflow', message: 'Age must be between 2 and 8' }),
]);

const range = check(state({ start: '', end: '' }));
range.start.check.validators.set([required('Start required')]);
range.end.check.validators.set([required('End required')]);

const person = check(state({ first: '', last: '' }));
person.first.check.validators.set([required('First name required')]);
person.last.check.validators.set([required('Last name required')]);

const errorsOf = (node: { check: { errors(): { message: string }[] } }) =>
	node.check.errors().map(e => e.message).join(', ') || 'none';

type Validatable = HTMLElement & { checkValidity(): boolean; reportValidity(): boolean; validationMessage: string; validity: ValidityState };

@tag('demo-bind-validation-section')
export class DemoBindValidationSection extends UIElement {
	/** Snapshot of an element's validity, rendered under it (host `validationMessage` shows the grouped format). */
	readonly status = state('');

	#snapshot(selector: string): void {
		const el = this.querySelector<Validatable>(selector);
		if (!el) return;
		const flags = Object.keys(ValidityState.prototype).filter(k => k !== 'valid' && (el.validity as never)[k]);
		this.status.set([
			`checkValidity(): ${el.checkValidity()}`,
			`flags: ${flags.join(', ') || '(none)'}`,
			`validationMessage:`,
			el.validationMessage || '(empty)',
		].join('\n'));
	}

	protected override template() {
		return t`
			<section class="demo-bind-block" id="validation">
				<h2>Validation</h2>
				<p class="desc">
					When the bound state has validators, <code>bind()</code> copies its errors onto the target's
					constraint validation: <code>:invalid</code>, <code>validity</code>, <code>validationMessage</code>,
					<code>checkValidity()</code> and form submission follow the model.
				</p>

				<h3>1. Native controls</h3>
				<p class="desc">Only <code>customError</code> is available to script; the message carries the detail.</p>
				<label class="demo-bind-field">
					Name
					<input type="text" .value=${bind(form.name)} />
				</label>
				<p class="demo-bind-mirror">Errors: <code>${errorsOf(form.name)}</code></p>
				<label class="demo-bind-field">
					Age
					<input type="number" .value=${bind(form.age)} />
				</label>
				<p class="demo-bind-mirror">Errors: <code>${errorsOf(form.age)}</code></p>
				<div class="demo-actions">
					<button type="button" @click=${() => form.name.set('')}>clear name from model</button>
					<button type="button" class="tonal" @click=${() => alert(
						[...this.querySelectorAll<HTMLInputElement>('input[type=text]:not([data-field]), input[type=number]')]
							.map(i => i.checkValidity() ? 'valid' : i.validationMessage).join('\n'))}>
						checkValidity()
					</button>
				</div>

				<h3>2. FormElement: errors merged into one state</h3>
				<p class="desc">
					Both <code>.first</code> and <code>.last</code> report into the same host. The real flags
					(<code>valueMissing</code>…) are unioned, messages are grouped per property, and the single
					anchor is <code>validationAnchor</code> (the error icon on the right, shown once the host is touched
					and invalid). Fill only one: the host stays invalid for the other.
				</p>
				<demo-bind-merged id="merged" .first=${bind(person.first)} .last=${bind(person.last)}></demo-bind-merged>
				<p class="demo-bind-mirror">first: <code>${errorsOf(person.first)}</code> · last: <code>${errorsOf(person.last)}</code></p>
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${() => this.#snapshot('#merged')}>inspect host validity</button>
					<button type="button" class="tonal" @click=${() => this.querySelector<Validatable>('#merged')?.reportValidity()}>reportValidity()</button>
				</div>

				<h3>3. FormGroup: errors routed to inner controls</h3>
				<p class="desc">
					<code>validationErrorTarget(property)</code> links each bound property to the inner input that owns
					it. Each input gets its own validity and bubble; the host itself stays valid. Fill only
					<em>end</em>: <em>start</em> stays invalid. <code>reportValidity()</code> fires
					<code>invalid</code> on every routed input (both messages show) and leaves the bubble on the first.
				</p>
				<demo-bind-range id="range" .start=${bind(range.start)} .end=${bind(range.end)}></demo-bind-range>
				<p class="demo-bind-mirror">start: <code>${errorsOf(range.start)}</code> · end: <code>${errorsOf(range.end)}</code></p>
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${() => this.#snapshot('#range')}>inspect host validity</button>
					<button type="button" class="tonal" @click=${() => this.querySelector<Validatable>('#range')?.reportValidity()}>reportValidity()</button>
				</div>

				<pre class="demo-bind-mirror">${this.status() || 'Press “inspect host validity” to see flags and message.'}</pre>
			</section>
		`;
	}
}
