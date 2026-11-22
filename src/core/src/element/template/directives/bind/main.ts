// `bind()` — two-way property directive. Mental model (details in `./design.md`):
//
//   model ──syncToView()──▶ element      on every render, skipped when `equals` says they match
//   model ◀─syncToModel()── element      on the binding's DOM event
//
// A `Binding` (`./resolve.ts`) describes both sides; this file only wires them to the element.
// Anything beyond value sync (e.g. form UI state) is added with `createBind(plugins)`.

import { Directive, directive, noChange, type DirectiveResult, isPropertyPartInfo, type PartInfo, type PropertyPartInfo } from '../directive.js';
import { assertBindableTarget, isRadio } from './defaults.js';
import { pullRadioSiblings, registerRadio, unregisterRadio } from './radio-group.js';
import { BIND_USAGE, isWritableSignal, resolveBinding } from './resolve.js';
import type { BindOptions, BindPlugin, BindSource, Binding, WritableSignal } from './types.js';
import { DEV } from '../../../../dev/flag.js';

/** DOM wiring for one binding position; torn down as a unit. */
interface Wiring {
	readonly element: Element;
	readonly event: string;
	readonly listener: () => void;
}

function defineBindDirective(plugins: readonly BindPlugin[]) {
	return class BindDirective extends Directive {
		/** Latest binding: refreshed every render so accessors/hooks are never stale. */
		#binding: Binding | undefined;
		#property = '';
		/** Latest first argument of `bind()`, read by plugins. */
		#source: unknown;
		/** Listener + element + event: only rebuilt when the element or event name changes. */
		#wiring: Wiring | undefined;
		/** Plugin disposers for `#pluginElement`. */
		#stopPlugins: (() => void)[] = [];
		#pluginElement: Element | undefined;

		constructor(partInfo: PartInfo) {
			super(partInfo);
			if (!isPropertyPartInfo(partInfo)) {
				throw new Error(DEV ? 'std-ui bind(): must be used as a property binding (e.g. `.value=${bind(...)}`).' : 'bind(): property binding only');
			}
			assertBindableTarget(partInfo.element, partInfo.name);
		}

		override update(part: PropertyPartInfo, ...args: readonly unknown[]): typeof noChange {
			const element = part.element;
			this.#source = args[0];
			this.#binding = resolveBinding(args, element, part.name);
			this.#property = part.name;

			this.#ensureWired(element, this.#binding.view.event);
			this.#syncToView();
			this.#resyncSelectAfterOptionsRender(element);
			this.#ensurePlugins(element);
			return noChange;
		}

		/** Runs the plugins once per element; they read the latest source through `context.source`. */
		#ensurePlugins(element: Element): void {
			if (this.#pluginElement === element) return;
			this.#disposePlugins();
			this.#pluginElement = element;
			const context = { element, property: this.#property, source: () => this.#source };
			for (const plugin of plugins) {
				const stop = plugin(context);
				if (stop) this.#stopPlugins.push(stop);
			}
		}

		#disposePlugins(): void {
			for (const stop of this.#stopPlugins.splice(0).reverse()) stop();
			this.#pluginElement = undefined;
		}

		override disconnected(): void {
			this.#disposePlugins();
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
	};
}

function assertUsable(first: object): void {
	const usable =
		isWritableSignal(first) ||
		(typeof (first as BindSource).get === 'function' && typeof (first as BindSource).set === 'function');
	if (!usable) throw new Error(DEV ? `std-ui bind(): ${BIND_USAGE}` : 'bind(): invalid target');
}

type BindFunction = {
	(state: WritableSignal, options?: BindOptions): DirectiveResult;
	(source: BindSource): DirectiveResult;
};

/**
 * Builds a bind directive that also runs `plugins` on every bound element (e.g. `formBind` in
 * `@std-ui/ext`). Value sync is identical to `bind`; plugins only add element-side behavior.
 */
export function createBind(plugins: readonly BindPlugin[]): BindFunction {
	const bound = directive(defineBindDirective([...plugins]));
	return ((first: object, options?: BindOptions) => {
		assertUsable(first);
		return bound(first, options);
	}) as BindFunction;
}

/**
 * Two-way property binding for `.prop=${bind(...)}`.
 *
 * ```ts
 * t`<input .value=${bind(form.query)} />`
 * t`<my-slider .level="${bind(form.level, { event: 'level-change' })}" />`
 * t`<input .value="${bind({ get: () => store.name, set: v => (store.name = String(v)) })}" />`
 * ```
 */
export const bind: BindFunction = createBind([]);
