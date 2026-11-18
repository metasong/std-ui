// formUi: touched / readonly / disabled held as state, shown on the element by formBind().
//   - flags are plain signals, so the controls below bind to them with `bind()`
//   - `flag()` reads the resolved value, `flag.own` writes this node's own flag
//   - readonly / disabled: set when the node or any ancestor is; touched(): when the node or any descendant is
//   - mark a whole subtree with `touchAll()`
import { bind, css, t, tag, UIElement, state } from '../../../../../core/src/index.js';
import { check, formBind, formUi } from '../../../../../ext/src/index.js';

const form = state({
	account: { email: 'ada@example.com', name: 'Ada' },
	address: { city: 'London', notes: '' },
}).with(check).with(formUi);

form.account.email.check.validators.set([
	v => (String(v).includes('@') ? undefined : { flag: 'typeMismatch' as const, message: 'Not an email' }),
]);
form.account.name.check.validators.set([
	v => (v ? undefined : { flag: 'valueMissing' as const, message: 'Name is required' }),
]);

const yes = (value: boolean) => (value ? 'yes' : 'no');

/** Tree depth in the mirror: 0 = root, 1 = object (account / address), 2 = leaf field. */
type FlagDepth = 0 | 1 | 2;

/** One row of flag controls for a node: its own readonly / disabled, and what it effectively is. */
function flagRow(label: string, node: { formUi: typeof form.formUi }, depth: FlagDepth) {
	const ui = node.formUi;
	return t`
		<tr class="depth-${depth}">
			<th scope="row">${label}</th>
			<td><input type="checkbox" aria-label="${label} readonly" .checked=${bind(ui.readonly.own)} /></td>
			<td><input type="checkbox" aria-label="${label} disabled" .checked=${bind(ui.disabled.own)} /></td>
			<td><code>${yes(ui.readonly())}</code></td>
			<td><code>${yes(ui.disabled())}</code></td>
			<td><code>${yes(ui.touched.own())}</code></td>
			<td><code>${yes(ui.touched())}</code></td>
		</tr>
	`;
}

@tag('demo-bind-form-ui-section')
export class DemoBindFormUiSection extends UIElement {
	static override styles = css`
		.demo-bind-mirror {
			margin: 0.5rem 0 0;
			font-size: 0.875rem;
		}

		.demo-bind-flags-table {
			border-collapse: collapse;
			width: 100%;
			max-width: 42rem;
			font-variant-numeric: tabular-nums;
		}

		.demo-bind-flags-table :is(th, td) {
			padding: 0.4rem 0.65rem;
			border-bottom: 1px solid var(--md-sys-color-outline-variant);
			text-align: center;
			vertical-align: middle;
		}

		.demo-bind-flags-table thead th {
			font-weight: 500;
			font-size: 0.8125rem;
			color: var(--md-sys-color-on-surface-variant);
			border-bottom-width: 2px;
		}

		.demo-bind-flags-table tbody th[scope='row'] {
			text-align: left;
			font-weight: 500;
			color: var(--md-sys-color-on-surface);
			background: var(--md-sys-color-surface-container-lowest);
		}

		.demo-bind-flags-table tr.depth-0 th[scope='row'] {
			font-weight: 600;
		}

		.demo-bind-flags-table tr.depth-1 th[scope='row'] {
			padding-left: 1.35rem;
			border-top: 1px solid var(--md-sys-color-outline-variant);
		}

		.demo-bind-flags-table tr.depth-2 th[scope='row'] {
			padding-left: 2.5rem;
			font-weight: 400;
			font-size: 0.8125rem;
			color: var(--md-sys-color-on-surface-variant);
		}

		/* Interleaved column bands: own flags · effective · touched */
		.demo-bind-flags-table :is(th, td):nth-child(2),
		.demo-bind-flags-table :is(th, td):nth-child(3),
		.demo-bind-flags-table :is(th, td):nth-child(6),
		.demo-bind-flags-table :is(th, td):nth-child(7) {
			background: color-mix(in srgb, var(--md-sys-color-secondary-container) 42%, transparent);
		}

		.demo-bind-flags-table :is(th, td):nth-child(4),
		.demo-bind-flags-table :is(th, td):nth-child(5) {
			background: color-mix(in srgb, var(--md-sys-color-tertiary-container) 38%, transparent);
		}

		.demo-bind-flags-table td input[type='checkbox'] {
			display: block;
			margin: 0 auto;
		}

		input:read-only,
		textarea:read-only {
			background-color: var(--md-sys-color-surface-container-high);
			color: var(--md-sys-color-on-surface-variant);
		}

		input:disabled,
		textarea:disabled {
			opacity: 0.65;
			cursor: not-allowed;
		}
	`;

	protected override template() {
		return t`
			<section class="demo-bind-block" id="form-ui">
				<h2>Form UI: touched, readonly, disabled</h2>
				<p class="desc">
					<code>formUi</code> keeps the flags on the state; <code>formBind()</code> shows them on the
					bound element (<code>readOnly</code> / <code>disabled</code>, <code>aria-*</code>, and
					<code>[data-touched]</code> for the error outline). Tick a box on the <em>account</em> row: both
					account fields follow, <em>address</em> does not.
				</p>

				<form @submit=${(e: Event) => { e.preventDefault(); form.formUi.touchAll(); }}>
					<fieldset class="demo-bind-field">
						<legend>account</legend>
						<label class="demo-bind-field">
							Email
							<input type="text" .value=${formBind(form.account.email)} />
						</label>
						<label class="demo-bind-field">
							Name
							<input type="text" .value=${formBind(form.account.name)} />
						</label>
					</fieldset>

					<fieldset class="demo-bind-field">
						<legend>address</legend>
						<label class="demo-bind-field">
							City
							<input type="text" .value=${formBind(form.address.city)} />
						</label>
						<label class="demo-bind-field">
							Notes (textarea)
							<textarea .value=${formBind(form.address.notes)}></textarea>
						</label>
					</fieldset>

					<div class="demo-actions">
						<button type="submit">Submit (touchAll)</button>
						<button type="button" class="tonal" @click=${() => form.formUi.untouchAll()}>untouchAll()</button>
						<button type="button" class="tonal" @click=${() => form.account.name.set('')}>clear name (invalid)</button>
					</div>
				</form>

				<h3>State flags</h3>
				<table class="demo-bind-mirror demo-bind-flags-table">
					<colgroup>
						<col class="band-label" />
						<col span="2" class="band-a" />
						<col span="2" class="band-b" />
						<col span="2" class="band-a" />
					</colgroup>
					<thead>
						<tr>
							<th></th><th>readonly.own</th><th>disabled.own</th>
							<th>readonly()</th><th>disabled()</th><th>touched.own</th><th>touched()</th>
						</tr>
					</thead>
					<tbody>
						${flagRow('form (root)', form, 0)}
						${flagRow('account', form.account, 1)}
						${flagRow('account.email', form.account.email, 2)}
						${flagRow('account.name', form.account.name, 2)}
						${flagRow('address', form.address, 1)}
						${flagRow('address.city', form.address.city, 2)}
						${flagRow('address.notes', form.address.notes, 2)}
					</tbody>
				</table>
				<p class="desc">
					Focus a field and tab away: its <code>touched.own</code> turns on and the invalid outline appears.
					<code>touched()</code> on a parent is true as soon as one member is touched, while its
					<code>touched.own</code> stays off.
				</p>
			</section>
		`;
	}
}
