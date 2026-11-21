// FormGroup with two inner inputs: exposes `.start` / `.end`, emits `start-change` / `end-change`,
// and routes each bound property's validation errors to its own inner input (`validationErrorTarget`).
import { t, tag } from '@std-ui/core';
import { FormGroup } from '@std-ui/ext';

@tag('demo-bind-range')
export class DemoBindRange extends FormGroup {
	#start = '';
	#end = '';

	get start(): string { return this.#start; }
	set start(v: string) { this.#set('start', v); }
	get end(): string { return this.#end; }
	set end(v: string) { this.#set('end', v); }

	#set(key: 'start' | 'end', v: string): void {
		const next = String(v ?? '');
		if (key === 'start') this.#start = next; else this.#end = next;
		const input = this.querySelector<HTMLInputElement>(`[data-field="${key}"]`);
		if (input && input.value !== next) input.value = next;
	}

	/** Each bound property's errors go to its own inner input (its own validity state and bubble). */
	override validationErrorTarget(property: string): HTMLInputElement | null {
		return this.querySelector<HTMLInputElement>(`[data-field="${property}"]`);
	}

	#edit(key: 'start' | 'end', e: Event): void {
		this.#set(key, (e.target as HTMLInputElement).value);
		this.dispatchEvent(new Event(`${key}-change`, { bubbles: true }));
		// Model validators have updated the input's validity by now; refresh a message already shown.
		const message = this.querySelector<HTMLElement>(`[data-message="${key}"]`);
		if (message?.textContent) this.#showMessage(key);
	}

	/** Every inner input fires `invalid` on `reportValidity()`, so all errors can show at once. */
	#showMessage(key: string): void {
		const input = this.querySelector<HTMLInputElement>(`[data-field="${key}"]`);
		const message = this.querySelector<HTMLElement>(`[data-message="${key}"]`);
		if (input && message) message.textContent = input.validationMessage;
	}

	protected override template() {
		return t`
			<input data-field="start" placeholder="start" .value=${this.#start}
				@input=${(e: Event) => this.#edit('start', e)} @invalid=${() => this.#showMessage('start')} />
			<small data-message="start" style="color: var(--std-sys-color-error, #b3261e)"></small>
			–
			<input data-field="end" placeholder="end" .value=${this.#end}
				@input=${(e: Event) => this.#edit('end', e)} @invalid=${() => this.#showMessage('end')} />
			<small data-message="end" style="color: var(--std-sys-color-error, #b3261e)"></small>
		`;
	}
}
