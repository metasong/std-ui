// Plain `FormElement` with two bound properties and NO routing: errors of both properties are merged
// into the host's single validity state (flags unioned, message grouped per property), anchored on
// `validationAnchor` (an error icon after the inputs, visible once touched and invalid).
import { FormElement, t, tag } from '../../../../src/index.js';

type Key = 'first' | 'last';

@tag('demo-bind-merged')
export class DemoBindMerged extends FormElement {
	#values: Record<Key, string> = { first: '', last: '' };

	get first(): string { return this.#values.first; }
	set first(v: string) { this.#set('first', v); }
	get last(): string { return this.#values.last; }
	set last(v: string) { this.#set('last', v); }

	#set(key: Key, v: string): void {
		const next = String(v ?? '');
		this.#values[key] = next;
		const input = this.querySelector<HTMLInputElement>(`[data-field="${key}"]`);
		if (input && input.value !== next) input.value = next;
	}

	/** One anchor for the whole host: the error icon on the right; the bubble points at it. */
	override get validationAnchor(): HTMLElement | null {
		return this.querySelector<HTMLElement>('[data-anchor]');
	}

	#edit(key: Key, e: Event): void {
		this.#set(key, (e.target as HTMLInputElement).value);
		this.dispatchEvent(new Event(`${key}-change`, { bubbles: true }));
	}

	protected override template() {
		return t`
			<input data-field="first" placeholder="first name" .value=${this.#values.first} @input=${(e: Event) => this.#edit('first', e)} />
			<input data-field="last" placeholder="last name" .value=${this.#values.last} @input=${(e: Event) => this.#edit('last', e)} />
			<span data-anchor class="error-icon" tabindex="-1" aria-hidden="true">!</span>
		`;
	}
}
