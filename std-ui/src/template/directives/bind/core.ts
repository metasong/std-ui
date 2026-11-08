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
	 * `${propertyName}-change` (e.g. `.document` → `document-change`).
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
};

function readProperty(element: Element, property: string): unknown {
	return (element as unknown as Record<string, unknown>)[property];
}

function writeProperty(element: Element, property: string, committed: unknown): void {
	(element as unknown as Record<string, unknown>)[property] = committed;
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

function isNativeValueElement(element: Element): boolean {
	return (
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLInputElement
	);
}

function isCheckableInput(element: Element): boolean {
	return (
		element instanceof HTMLInputElement &&
		(element.type === 'checkbox' || element.type === 'radio')
	);
}

/** `.checked` on a plain <input> must be checkbox or radio (custom elements use `checked-change`). */
function validateCheckedBindTarget(element: Element, property: string): void {
	if (property !== 'checked') return;
	if (!(element instanceof HTMLInputElement)) return;
	if (!isCheckableInput(element)) {
		throw new Error(
			'std-ui bind(): ".checked" on <input> requires type="checkbox" or type="radio".',
		);
	}
}

/** Native control events when applicable; otherwise `${property}-change`. */
function defaultEvent(element: Element, property: string): string {
	if (property === 'checked') {
		if (isCheckableInput(element)) return 'change';
		return `${property}-change`;
	}
	if (property === 'value') {
		if (element instanceof HTMLSelectElement) return 'change';
		if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return 'input';
		return `${property}-change`;
	}
	return `${property}-change`;
}

function resolveBindArgs(
	args: readonly unknown[],
	property: string,
	element: Element,
): ResolvedBind {
	let accessor: BindAccessor;
	let options: BindOptions = {};

	if (args.length >= 2 && typeof args[1] === 'string' && typeof args[0] === 'object' && args[0] !== null) {
		const host = args[0] as object;
		const key = args[1] as string;
		accessor = {
			get: () => (host as Record<string, unknown>)[key],
			set: v => {
				(host as Record<string, unknown>)[key] = v;
			},
		};
		if (args[2] !== undefined && typeof args[2] === 'object' && args[2] !== null) {
			options = args[2] as BindOptions;
		}
	} else {
		const source = args[0] as BindSource;
		if (typeof source?.get !== 'function' || typeof source?.set !== 'function') {
			throw new Error('std-ui bind(): pass (host, key[, options]), or ({ get, set, ... }).');
		}
		accessor = { get: source.get, set: source.set };
		const { event, equals, read, write, ...rest } = source;
		void rest;
		options = { event, equals, read, write };
	}

	const event = options.event ?? defaultEvent(element, property);

	return {
		...accessor,
		event,
		read: options.read ?? readProperty,
		write: options.write ?? writeProperty,
		equals: options.equals ?? defaultEquals(property, element),
	};
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
	#resolved: ResolvedBind | undefined;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.PROPERTY) {
			throw new Error('std-ui bind(): must be used as a property binding (e.g. `.value="${bind(...)}"`).');
		}
		validateCheckedBindTarget(partInfo.element, partInfo.name);
	}

	override update(part: PropertyPartInfo, ...args: readonly unknown[]): typeof noChange {
		const el = part.element;
		const prop = part.name;
		const resolved = resolveBindArgs(args, prop, el);

		if (this.#listener === undefined) {
			this.#resolved = resolved;
			this.#element = el;
			this.#eventName = resolved.event;
			this.#listener = () => {
				const cfg = this.#resolved!;
				const live = cfg.read(el, prop);
				if (!cfg.equals(cfg.get(), live)) cfg.set(live);
			};
			el.addEventListener(resolved.event, this.#listener);
		}

		const cfg = this.#resolved ?? resolved;
		const next = cfg.get();
		const live = cfg.read(el, prop);
		if (!cfg.equals(next, live)) cfg.write(el, prop, next);

		return noChange;
	}

	override disconnected(): void {
		if (this.#listener && this.#element && this.#eventName) {
			this.#element.removeEventListener(this.#eventName, this.#listener);
		}
		this.#listener = undefined;
		this.#eventName = undefined;
		this.#element = undefined;
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
	if (key !== undefined) return bindDirective(hostOrSource, key, options);
	if (
		typeof hostOrSource === 'object' &&
		hostOrSource !== null &&
		'get' in hostOrSource &&
		'set' in hostOrSource
	) {
		return bindDirective(hostOrSource);
	}
	throw new Error('std-ui bind(): pass (host, key[, options]), or ({ get, set, ... }).');
}
