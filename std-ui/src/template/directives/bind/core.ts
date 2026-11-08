import {
	Directive,
	directive,
	noChange,
	PartType,
	type DirectiveResult,
	type PartInfo,
	type PropertyPartInfo,
} from '../../directive.js';

/** Read/write pair for `bind()` when not using `(host, key)`. */
export interface BindAccessor {
	get: () => unknown;
	set: (value: unknown) => void;
}

/** Optional hooks and event name for non-form or custom-element bindings. */
export interface BindOptions {
	/**
	 * DOM event that means the user (or component) changed the bound property.
	 * Native `.value` / `.checked` use `input` or `change` where appropriate; otherwise defaults to
	 * `${kebab-case property}-change` (e.g. `.document` → `document-change`, `.minValue` → `min-value-change`).
	 */
	event?: string;
	/** Compare model vs element before writing (live semantics). */
	equals?: (committed: unknown, live: unknown) => boolean;
	read?: (element: Element, property: string) => unknown;
	write?: (element: Element, property: string, committed: unknown) => void;
}

/** `bind({ get, set, event, ... })` — accessor and options in one object. */
export type BindSource = BindAccessor & BindOptions;

type ResolvedBind = BindAccessor & {
	event: string;
	read: (element: Element, property: string) => unknown;
	write: (element: Element, property: string, committed: unknown) => void;
	equals: (committed: unknown, live: unknown) => boolean;
	parse: (live: unknown, current: unknown) => unknown;
};

function readProperty(element: Element, property: string): unknown {
	return (element as unknown as Record<string, unknown>)[property];
}

function writeProperty(element: Element, property: string, committed: unknown): void {
	(element as unknown as Record<string, unknown>)[property] = committed;
}

function isNativeValueElement(element: Element): boolean {
	return (
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLInputElement
	);
}

function isCheckableInput(element: Element): element is HTMLInputElement {
	return (
		element instanceof HTMLInputElement &&
		(element.type === 'checkbox' || element.type === 'radio')
	);
}

function isRadio(element: Element): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.type === 'radio';
}

function describe(element: Element, property: string): string {
	return `<${element.localName}>.${property}`;
}

function defaultEquals(
	property: string,
	element: Element,
): (committed: unknown, live: unknown) => boolean {
	if (property === 'checked' && isCheckableInput(element)) {
		return (a, b) => Boolean(a) === Boolean(b);
	}
	if (property === 'value' && isNativeValueElement(element)) {
		return (a, b) => String(a ?? '') === String(b ?? '');
	}
	return (a, b) => Object.is(a, b);
}

/** Internal view → model coercion: a numeric model bound to a native control stays a number.
 *  Custom conversions belong in `read` / `write`. */
function defaultParse(property: string, element: Element): (live: unknown, current: unknown) => unknown {
	if (property === 'value' && isNativeValueElement(element)) {
		return (live, current) => {
			if (typeof current === 'number' && typeof live === 'string' && live.trim() !== '') {
				const n = Number(live);
				if (!Number.isNaN(n)) return n;
			}
			return live;
		};
	}
	return live => live;
}

/** `.checked` on a plain <input> must be checkbox or radio (custom elements use `checked-change`). */
function validateCheckedBindTarget(element: Element, property: string): void {
	if (property !== 'checked') return;
	if (!(element instanceof HTMLInputElement)) return;
	if (!isCheckableInput(element)) {
		throw new Error(
			`std-ui bind(): ${describe(element, property)} requires type="checkbox" or type="radio".`,
		);
	}
}

function kebab(property: string): string {
	return property.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Native control events when applicable; otherwise `${kebab(property)}-change`. */
function defaultEvent(element: Element, property: string): string {
	if (property === 'checked') {
		if (isCheckableInput(element)) return 'change';
		return `${kebab(property)}-change`;
	}
	if (property === 'value') {
		if (element instanceof HTMLSelectElement) return 'change';
		if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return 'input';
		return `${kebab(property)}-change`;
	}
	return `${kebab(property)}-change`;
}

function isHostKey(args: readonly unknown[]): args is [object, string, BindOptions?] {
	return typeof args[0] === 'object' && args[0] !== null && typeof args[1] === 'string';
}

function resolveBindArgs(
	args: readonly unknown[],
	property: string,
	element: Element,
): ResolvedBind {
	let accessor: BindAccessor;
	let options: BindOptions = {};

	if (isHostKey(args)) {
		const host = args[0] as Record<string, unknown>;
		const key = args[1];
		accessor = {
			get: () => host[key],
			set: v => {
				host[key] = v;
			},
		};
		if (typeof args[2] === 'object' && args[2] !== null) options = args[2];
	} else {
		const source = args[0] as BindSource | undefined;
		if (typeof source?.get !== 'function' || typeof source?.set !== 'function') {
			throw new Error(
				`std-ui bind() on ${describe(element, property)}: pass (host, key[, options]), or ({ get, set, ... }).`,
			);
		}
		const { get, set, ...rest } = source;
		accessor = { get, set };
		options = rest;
	}

	return {
		...accessor,
		event: options.event ?? defaultEvent(element, property),
		read: options.read ?? readProperty,
		write: options.write ?? writeProperty,
		equals: options.equals ?? defaultEquals(property, element),
		parse: defaultParse(property, element),
	};
}

/** Element → "re-sync from model" callback, so radio siblings can be refreshed together. */
const radioSync = new WeakMap<Element, () => void>();

function syncRadioSiblings(radio: HTMLInputElement): void {
	if (!radio.name) return;
	const root: ParentNode = radio.form ?? (radio.getRootNode() as ParentNode);
	if (typeof root.querySelectorAll !== 'function') return;
	for (const other of Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]'))) {
		if (other === radio || other.name !== radio.name) continue;
		radioSync.get(other)?.();
	}
}

/**
 * Two-way property bind: live compare on model → view, plus a DOM event for view → model.
 *
 * ```ts
 * html`<input .value="${bind(this, 'query')}" />`
 * html`<my-slider .level="${bind(this, 'level', { event: 'level-change' })}" />`
 * ```
 */
class BindDirective extends Directive {
	#listener: ((ev: Event) => void) | undefined;
	#eventName: string | undefined;
	#element: Element | undefined;
	#property = '';
	#resolved: ResolvedBind | undefined;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.PROPERTY) {
			throw new Error('std-ui bind(): must be used as a property binding (e.g. `.value="${bind(...)}"`).');
		}
		validateCheckedBindTarget(partInfo.element, partInfo.name);
	}

	#detach(): void {
		if (this.#listener && this.#element && this.#eventName) {
			this.#element.removeEventListener(this.#eventName, this.#listener);
		}
		if (this.#element) radioSync.delete(this.#element);
		this.#listener = undefined;
		this.#eventName = undefined;
		this.#element = undefined;
	}

	/** model → view */
	#syncDown(): void {
		const cfg = this.#resolved;
		const el = this.#element;
		if (!cfg || !el) return;
		const next = cfg.get();
		const live = cfg.read(el, this.#property);
		if (!cfg.equals(next, live)) cfg.write(el, this.#property, next);
	}

	override update(part: PropertyPartInfo, ...args: readonly unknown[]): typeof noChange {
		const el = part.element;
		const prop = part.name;
		const resolved = resolveBindArgs(args, prop, el);

		// Always use the latest accessor/hooks; only the DOM wiring is position-locked.
		this.#resolved = resolved;
		this.#property = prop;

		if (this.#listener === undefined || this.#element !== el || this.#eventName !== resolved.event) {
			this.#detach();
			this.#element = el;
			this.#eventName = resolved.event;
			this.#listener = () => {
				const cfg = this.#resolved;
				if (!cfg) return;
				const live = cfg.read(el, this.#property);
				if (!cfg.equals(cfg.get(), live)) cfg.set(cfg.parse(live, cfg.get()));
				if (isRadio(el)) syncRadioSiblings(el);
			};
			el.addEventListener(resolved.event, this.#listener);
			if (isRadio(el)) radioSync.set(el, () => this.#syncDown());
		}

		this.#syncDown();

		// A <select>'s value can only be applied once its <option>s exist; re-sync after the render pass.
		if (prop === 'value' && el instanceof HTMLSelectElement) {
			queueMicrotask(() => {
				if (this.#element === el) this.#syncDown();
			});
		}

		return noChange;
	}

	override disconnected(): void {
		this.#detach();
		this.#resolved = undefined;
	}
}

const bindDirective = directive(BindDirective);

export function bind(source: BindSource): DirectiveResult;
export function bind(host: object, key: string, options?: BindOptions): DirectiveResult;
export function bind(
	hostOrSource: object | BindSource,
	key?: string,
	options?: BindOptions,
): DirectiveResult {
	if (typeof key === 'string') return bindDirective(hostOrSource, key, options);
	if (
		typeof hostOrSource === 'object' &&
		hostOrSource !== null &&
		typeof (hostOrSource as BindSource).get === 'function' &&
		typeof (hostOrSource as BindSource).set === 'function'
	) {
		return bindDirective(hostOrSource);
	}
	throw new Error('std-ui bind(): pass (host, key[, options]), or ({ get, set, ... }).');
}
