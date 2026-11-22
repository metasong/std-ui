// formBind(): the flags and aria attributes it puts on a bound element, all driven by state.
//   - touched   `formUi.touched`   → [data-touched] / :state(touched)   (focusout, or submit → touchAll)
//   - dirty     `changes.dirty`    → [data-dirty]   / :state(dirty)
//   - pending   `check.pending.own` → [data-pending] / :state(pending), aria-busy   (async validator)
//   - invalid   `check.errors`       → aria-invalid, and the text of the element named by aria-errormessage
//   - required  a `required()` validator (its `flag` is 'valueMissing') → aria-required
// The table reads the attributes straight off the inputs, so it shows what is really on the element.
import { css, state, t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import { asyncValidator, changes, check, email, formBind, formUi, minLength, required } from '@std-ui/ext';

const form = stateTree({ name: 'Ada', email: 'ada@example.com' }).with(check).with(changes).with(formUi);

form.name.check.validators.set([required('Name is required'), minLength(3)]);
form.email.check.validators.set([
	required('Email is required'),
	email(),
	// Stands in for a server round trip: this address is "taken".
	asyncValidator<string>(
		async (value, { abortSignal }) => {
			await new Promise((resolve) => setTimeout(resolve, 900));
			if (abortSignal.aborted) return null;
			return value === 'taken@example.com' ? { flag: 'customError' as const, message: 'Already registered' } : null;
		},
		{ debounce: 300 },
	),
]);

const FIELDS = [
	{ id: 'flags-name', label: 'Name' },
	{ id: 'flags-email', label: 'Email' },
] as const;

const ATTRIBUTES = ['data-touched', 'data-dirty', 'data-pending', 'aria-invalid', 'aria-required', 'aria-busy'] as const;

/**
 * Pseudo-classes are not attributes, so they are read with `matches()`. They only change together
 * with an attribute above (`aria-invalid` follows validity), so the table re-renders in time.
 */
const PSEUDO_CLASSES = [':invalid', '[data-touched]:invalid'] as const;

/** Bumped whenever an attribute on an observed input changes, so the table re-reads them. */
const attributesChanged = state(0);

@tag('demo-bind-form-flags-section')
export class DemoBindFormFlagsSection extends UIElement {
	static override styles = css`
		.demo-flags-error {
			display: block;
			min-height: 1.25rem;
			font-size: 0.8125rem;
			color: #b3261e;
		}

		/* aria-errormessage text is always in the DOM; show it only after touched */
		input:not([data-touched]) + .demo-flags-error {
			visibility: hidden;
		}

		/* an async check is running */
		input[data-pending] {
			outline: 2px dashed var(--std-sys-color-primary);
			cursor: progress;
		}

		/* edited since the initial value */
		input[data-dirty] {
			border-left: 4px solid var(--std-sys-color-tertiary);
		}

		.demo-flags-scroll {
			overflow-x: auto;
		}

		.demo-flags-table {
			border-collapse: collapse;
			font-size: 0.8125rem;
			margin-top: 0.75rem;
		}

		.demo-flags-table :is(th, td) {
			padding: 0.35rem 0.65rem;
			border-bottom: 1px solid var(--std-sys-color-outline-variant);
			text-align: center;
		}

		.demo-flags-table tbody th {
			text-align: left;
			font-weight: 500;
		}

		.demo-flags-table td.on code {
			font-weight: 700;
			color: var(--std-sys-color-primary);
		}
	`;

	#observer?: MutationObserver;

	protected override firstUpdated(): void {
		const bump = () => attributesChanged.set(attributesChanged.peek() + 1);
		this.#observer = new MutationObserver(bump);
		for (const { id } of FIELDS) {
			const input = this.renderRoot.querySelector(`#${id}`);
			if (input) this.#observer.observe(input, { attributes: true });
		}
		bump();
	}

	protected override disconnect(): void {
		this.#observer?.disconnect();
	}

	#row(field: (typeof FIELDS)[number]) {
		const input = this.renderRoot.querySelector(`#${field.id}`);
		return t`
			<tr>
				<th scope="row">${field.label}</th>
				${ATTRIBUTES.map((name) => {
					const value = input?.getAttribute(name);
					return t`<td class=${value === null || value === undefined ? '' : 'on'}><code>${value === null || value === undefined ? '-' : value || 'present'}</code></td>`;
				})}
				${PSEUDO_CLASSES.map((selector) => {
					const on = input?.matches(selector) ?? false;
					return t`<td class=${on ? 'on' : ''}><code>${on ? 'matches' : '-'}</code></td>`;
				})}
			</tr>
		`;
	}

	protected override template() {
		attributesChanged(); // tracked: re-render when an observed attribute changes
		return t`
			<section class="demo-bind-block" id="form-flags">
				<h2>Form flags and aria</h2>
				<p class="desc">
					Everything below is set by <code>formBind()</code> from the state. Edit a field (<code>dirty</code>),
					tab away (<code>touched</code>), or type <code>taken@example.com</code> in Email to see
					<code>pending</code> while the async check runs, then <code>aria-invalid</code> and the error text.
				</p>

				<form novalidate @submit=${(e: Event) => { e.preventDefault(); form.formUi.touchAll(); }}>
					<label class="demo-bind-field">
						Name
						<input id="flags-name" type="text" aria-errormessage="flags-name-error" .value=${formBind(form.name)} />
						<span id="flags-name-error" class="demo-flags-error"></span>
					</label>
					<label class="demo-bind-field">
						Email
						<input id="flags-email" type="text" aria-errormessage="flags-email-error" .value=${formBind(form.email)} />
						<span id="flags-email-error" class="demo-flags-error"></span>
					</label>

					<div class="demo-actions">
						<button type="submit">Submit (touchAll)</button>
						<button type="button" class="tonal" @click=${() => form.formUi.untouchAll()}>untouchAll()</button>
						<button
							type="button"
							class="tonal"
							@click=${() => {
								form.name.changes.reset(form.name.peek());
								form.email.changes.reset(form.email.peek());
							}}
						>
							Mark as saved (reset)
						</button>
					</div>
				</form>

				<h3>Attributes and pseudo-classes on the inputs</h3>
				<div class="demo-flags-scroll">
				<table class="demo-flags-table">
					<thead>
						<tr>
							<th></th>
							${ATTRIBUTES.map((name) => t`<th><code>${name}</code></th>`)}
							${PSEUDO_CLASSES.map((selector) => t`<th><code>${selector}</code></th>`)}
						</tr>
					</thead>
					<tbody>
						${FIELDS.map((field) => this.#row(field))}
					</tbody>
				</table>
				</div>
				<p class="desc">
					<code>:invalid</code> is on as soon as the state has errors (it comes from the constraint validation
					<code>formBind</code> fills), while <code>[data-touched]:invalid</code> waits for the user, which is
					what the red outline uses.
				</p>
				<p class="desc">
					<code>aria-required</code> comes from the <code>required()</code> validator, not from the native
					<code>required</code> attribute, so the browser adds no second error.
				</p>
			</section>
		`;
	}
}
