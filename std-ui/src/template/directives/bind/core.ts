// `bind()` — two-way property directive. Mental model (details in `./design.md`):
//
//   model ──syncToView()──▶ element      on every render, skipped when `equals` says they match
//   model ◀─syncToModel()── element      on the binding's DOM event
//
// A `Binding` (`./resolve.ts`) describes both sides; this file only wires them to the element.

import {
	Directive,
	directive,
	noChange,
	PartType,
	type DirectiveResult,
	type PartInfo,
	type PropertyPartInfo,
} from '../../directive.js';
import { assertBindableTarget, isRadio } from './defaults.js';
import { pullRadioSiblings, registerRadio, unregisterRadio } from './radio-group.js';
import { BIND_USAGE, isWritableSignal, resolveBinding } from './resolve.js';
import type { BindOptions, BindSource, Binding, WritableSignal } from './types.js';

/** DOM wiring for one binding position; torn down as a unit. */
interface Wiring {
	readonly element: Element;
	readonly event: string;
	readonly listener: () => void;
}

class BindDirective extends Directive {
	/** Latest binding: refreshed every render so accessors/hooks are never stale. */
	#binding: Binding | undefined;
	#property = '';
	/** Listener + element + event: only rebuilt when the element or event name changes. */
	#wiring: Wiring | undefined;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.PROPERTY) {
			throw new Error('std-ui bind(): must be used as a property binding (e.g. `.value="${bind(...)}"`).');
		}
		assertBindableTarget(partInfo.element, partInfo.name);
	}

	override update(part: PropertyPartInfo, ...args: readonly unknown[]): typeof noChange {
		const element = part.element;
		this.#binding = resolveBinding(args, element, part.name);
		this.#property = part.name;

		this.#ensureWired(element, this.#binding.view.event);
		this.#syncToView();
		this.#resyncSelectAfterOptionsRender(element);
		return noChange;
	}

	override disconnected(): void {
		this.#unwire();
		this.#binding = undefined;
	}

	/** model → element (skipped when the element already shows the model). */
	#syncToView(): void {
		const binding = this.#binding;
		const element = this.#wiring?.element;
		if (!binding || !element) return;
		const model = binding.model.get();
		if (!binding.equals(model, binding.view.read(element, this.#property))) {
			binding.view.write(element, this.#property, model);
		}
	}

	/** element → model (skipped when the model already matches). */
	#syncToModel(element: Element): void {
		const binding = this.#binding;
		if (!binding) return;
		const view = binding.view.read(element, this.#property);
		const model = binding.model.get();
		if (!binding.equals(model, view)) binding.model.set(binding.coerce(view, model));
	}

	#onViewEvent(element: Element): void {
		this.#syncToModel(element);
		if (isRadio(element)) pullRadioSiblings(element);
	}

	#ensureWired(element: Element, event: string): void {
		const wiring = this.#wiring;
		if (wiring?.element === element && wiring.event === event) return;
		this.#unwire();
		const listener = () => this.#onViewEvent(element);
		element.addEventListener(event, listener);
		this.#wiring = { element, event, listener };
		if (isRadio(element)) registerRadio(element, () => this.#syncToModel(element));
	}

	#unwire(): void {
		const wiring = this.#wiring;
		if (!wiring) return;
		wiring.element.removeEventListener(wiring.event, wiring.listener);
		unregisterRadio(wiring.element);
		this.#wiring = undefined;
	}

	/** A <select>'s `.value` only sticks once its <option>s exist, which may be after this part runs. */
	#resyncSelectAfterOptionsRender(element: Element): void {
		if (this.#property !== 'value' || !(element instanceof HTMLSelectElement)) return;
		queueMicrotask(() => {
			if (this.#wiring?.element === element) this.#syncToView();
		});
	}
}

const bindDirective = directive(BindDirective);

/**
 * Two-way property binding for `.prop="${bind(...)}"`.
 *
 * ```ts
 * t`<input .value="${bind(form.query)}" />`
 * t`<my-slider .level="${bind(form.level, { event: 'level-change' })}" />`
 * t`<input .value="${bind({ get: () => store.name, set: v => (store.name = String(v)) })}" />`
 * ```
 */
export function bind(state: WritableSignal, options?: BindOptions): DirectiveResult;
export function bind(source: BindSource): DirectiveResult;
export function bind(first: object, options?: BindOptions): DirectiveResult {
	const usable =
		isWritableSignal(first) ||
		(typeof (first as BindSource).get === 'function' && typeof (first as BindSource).set === 'function');
	if (!usable) throw new Error(`std-ui bind(): ${BIND_USAGE}`);
	return bindDirective(first, options);
}
