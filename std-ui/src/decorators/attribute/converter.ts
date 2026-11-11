// Attribute <-> property value conversion: the `type`/`converter` half of `@attribute()`'s options
// (see `./attribute.decorator.ts`, same folder). Everything here is pure data + pure functions - no class-field or
// metadata concerns - so it can be read/tested in isolation from *how* a field ends up calling it.

/**
 * `lit`-style type hint for the *default* attribute <-> property conversion: the JS constructor
 * the property's value conceptually is, not a runtime `typeof`/`instanceof` check. Defaults to
 * `String`. Pass an explicit `converter` (below) instead of (or alongside) `type` for anything
 * these five defaults don't cover - `type` just selects which default converter applies when no
 * `converter` is given.
 */
export type AttributeType =
	| StringConstructor
	| NumberConstructor
	| BooleanConstructor
	| ObjectConstructor
	| ArrayConstructor;

/**
 * Explicit, fully custom attribute <-> property conversion for one `@attribute()` field - same
 * shape as `lit`'s `converter` option. Supplying this overrides whatever default converter `type`
 * would otherwise select.
 */
export interface AttributeConverter<V = unknown> {
	/**
	 * Converts the HTML attribute string (or `null` if absent/removed) into the property value.
	 * `oldValue` is the previous attribute string (`null` if it was absent), as passed to
	 * `attributeChangedCallback`.
	 */
	fromAttribute(value: string | null, oldValue: string | null): V;
	/**
	 * Converts the property value into attribute text, `null` to remove the attribute, or
	 * `undefined` to leave the host attribute unchanged (property → attribute reflection only).
	 */
	toAttribute(value: V): string | null | undefined;
}

const stringConverter: AttributeConverter<string> = {
	fromAttribute: value => value ?? '',
	toAttribute: value => (value == null ? null : String(value)),
};

const numberConverter: AttributeConverter<number> = {
	fromAttribute: value => (value === null ? 0 : Number(value)),
	toAttribute: value => (value == null ? null : String(value)),
};

const booleanConverter: AttributeConverter<boolean> = {
	// Presence-based, matching `?attr` in `../template/html.md`: any text (including `""`) means
	// `true`; only an absent/removed attribute means `false`.
	fromAttribute: value => value !== null,
	toAttribute: value => (value ? '' : null),
};

/**
 * Default `Object`/`Array` converter: JSON-serializes the value for the attribute and JSON-parses
 * it back, falling back to `emptyValue` (`{}` / `[]`) when the attribute is absent or unparsable.
 * `toAttribute` deliberately returns `''` (present-but-empty), not `null` (removed), for a falsy
 * value, so the attribute always reflects *some* JSON text once the property has ever been set -
 * matching `lit`'s own `Object`/`Array` converter convention.
 */
function jsonConverter<V>(emptyValue: V): AttributeConverter<V> {
	return {
		fromAttribute: value => {
			if (!value) return emptyValue;
			try { return JSON.parse(value) as V; } catch { return emptyValue; }
		},
		toAttribute: value => (value ? JSON.stringify(value) : ''),
	};
}

/** `type` -> default `AttributeConverter`, keyed by the constructor identity `lit` itself uses. */
const defaultConverters = new Map<AttributeType, AttributeConverter<unknown>>([
	[String, stringConverter],
	[Number, numberConverter],
	[Boolean, booleanConverter],
	[Object, jsonConverter({})],
	[Array, jsonConverter([])],
]);

/**
 * Infers the default `AttributeType` from a field's own initial value, for when `@attribute()` is
 * given neither `type` nor `converter` - so an obviously-numeric/boolean/object/array initializer
 * (`count = 0`, `active = false`, `config = {}`, `tags = []`) doesn't also need `type: Number` /
 * `Boolean` / `Object` / `Array` spelled out redundantly. `null`/`undefined`/anything else falls
 * back to `String`, matching the pre-existing default.
 */
export function inferAttributeType(value: unknown): AttributeType {
	if (Array.isArray(value)) return Array;
	switch (typeof value) {
		case 'number': return Number;
		case 'boolean': return Boolean;
		case 'object': return value === null ? String : Object;
		default: return String;
	}
}

/** Picks `converter` if given, else the default converter for `type` (`String` if omitted). */
export function resolveConverter<V>(type: AttributeType | undefined, converter: AttributeConverter<V> | undefined): AttributeConverter<V> {
	if (converter) return converter;
	const resolved = defaultConverters.get(type ?? String);
	if (!resolved) {
		throw new Error(
			"@attribute(): no default converter for this 'type' - pass a 'converter' option instead.",
		);
	}
	return resolved as AttributeConverter<V>;
}

/** Parses an attribute string (or `null` if absent/removed) into a property value, via `converter`. */
export function parseAttribute(value: string | null, oldValue: string | null, converter: AttributeConverter): unknown {
	return converter.fromAttribute(value, oldValue);
}

/**
 * Serializes a property value back into attribute text via `converter`: `null` removes the
 * attribute; `undefined` means do not touch the attribute.
 */
export function serializeAttribute(value: unknown, converter: AttributeConverter): string | null | undefined {
	return converter.toAttribute(value);
}

/** `maxCount` -> `max-count`: default attribute name for a camelCase (or plain) field name. */
export function toAttributeName(key: PropertyKey): string {
	return String(key).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
