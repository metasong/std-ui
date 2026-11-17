// --- std-ui's template syntax, plugged into the generic engine. ------------------------------------
//
// `engine.ts` knows only templates, tags, attributes and lifecycle hooks. Everything specific to
// std-ui lives here, grouped by concern and wired in through `EngineHooks`:
//
//   - binding syntax   : `.prop`, `?bool`, `@event.modifier`, plain `attr` (+ single-interpolation rules),
//                        and bare element slots `<div ${x}>`
//   - part creation    : descriptor kind -> `Part` class
//   - SVG namespace    : wrap/unwrap markup meant to be interpolated into an existing `<svg>`
//   - dev diagnostics  : warn on undefined custom elements
//
// See `html.ts` for the overall design.

import { DEV, warnOnUndefinedElements } from '../../../dev/index.js';
import { findBindingExtension, type BindingExtension, type BindingName } from './binding-extension.js';
import '../extensions/builtin.js';
import '../extensions/class-style.js';
import { createEngine, type EngineHooks, type SlotDescriptor, type Template as EngineTemplate } from './engine.js';
// Parts import `instantiate` for nested templates; they are only touched lazily inside hooks, so
// the module cycle is harmless.
import { ElementPart, ChildPart, PartType, type Modifier, type Part } from '../parts/index.js';

export interface PartDescriptor extends SlotDescriptor {
	/** Slots are `CHILD`/`ELEMENT`; every attribute-like binding is `ATTRIBUTE` (its extension builds the part). */
	kind: typeof PartType.CHILD | typeof PartType.ELEMENT | typeof PartType.ATTRIBUTE;
	/** Attribute/property/event name, sans its `.`/`?`/`@` sigil, `:arg` and any `.modifier`s. Unused for `kind: PartType.CHILD`. */
	name: string;
	/** The `:arg` of `name:arg`. Reserved: unused by the built-in kinds, only extensions may consume it. */
	arg?: string;
	/** Parsed `.modifier[:value]`s in source order; each kind interprets the ones it knows. */
	modifiers?: Modifier[];
	/** Set when a registered `BindingExtension` handles this binding (e.g. `class.active`); it builds the part. */
	extension?: { binding: BindingName; extension: BindingExtension };
	/** `kind: PartType.ATTRIBUTE` only: the static text segments surrounding each interpolation in this
	 *  attribute's value, e.g. `class="a-${x}-b-${y}"` -> `['a-', '-b-', '']`. Always has exactly
	 *  `valueCount + 1` entries; `['', '']` for a bare `attr=${value}` with no static text. */
	literals?: string[];
	/** Number of consecutive entries of the tagged-template's `values[]` this descriptor consumes.
	 *  `1` for every kind except `attr`, which is `>= 1`. */
	valueCount: number;
}

export type Template = EngineTemplate<PartDescriptor>;

/** `'svg'` wraps the compiled markup in a temporary `<svg>` during parsing so elements land in the
 *  SVG namespace. See `html.ts`'s `svg()`. */
export type TemplateType = 'html' | 'svg';

// --- Binding syntax -----------------------------------------------------------------------------

/** `[sigil]name[:arg](.modifier[:value])*`, the full attribute name as handed over by the engine.
 *  Static args/values are `[\w-]+` (no `.`, which would start the next modifier). See `compile-attributes.md`. */
const BINDING_NAME_RE = /^([^\w\s"'<>\/=:-]?)([\w-]+)(?::([\w-]+))?((?:\.[\w-]+(?::[\w-]+)?)*)$/;

interface OpenBinding {
	rawName: string;
	binding: BindingName;
	extension: BindingExtension;
}

function parseModifiers(raw: string): Modifier[] {
	if (!raw) return [];
	return raw
		.slice(1)
		.split('.')
		.map(part => {
			const [name, value] = part.split(':');
			return value === undefined ? { name } : { name, value };
		});
}

function parseBinding(rawName: string, markup: string): OpenBinding {
	const match = BINDING_NAME_RE.exec(rawName);
	if (!match) {
		throw new Error(`std-ui html: could not parse an attribute binding near "...${markup.slice(-40)}"`);
	}
	const [, sigil, name, arg, rawModifiers] = match;
	const binding: BindingName = { sigil, name, arg, modifiers: parseModifiers(rawModifiers) };
	const extension = findBindingExtension(binding);
	if (!extension) {
		throw new Error(`std-ui html: unknown binding sigil "${sigil}" in "${rawName}" - register a BindingExtension for it.`);
	}
	extension.validate?.(binding);
	return { rawName, binding, extension };
}

function describeBinding(open: OpenBinding, literals: readonly string[], valueCount: number): PartDescriptor {
	const { binding, extension, rawName } = open;
	const mustBeSingle = extension.single === true;
	if (mustBeSingle) {
		if (valueCount !== 1 || literals.some(s => s !== '')) {
			throw new Error(
				`std-ui html: "${rawName}" must bind exactly one interpolation with no static ` +
					`text, e.g. ${rawName}="\${value}" - only plain attributes (no sigil) support ` +
					`multiple/mixed interpolations like class="\${a} \${b}".`,
			);
		}
	}
	return {
		kind: PartType.ATTRIBUTE,
		name: binding.name,
		arg: binding.arg,
		modifiers: [...binding.modifiers],
		extension: { binding, extension },
		nodeIndex: -1,
		literals: mustBeSingle ? undefined : [...literals],
		valueCount,
	};
}

// --- Part creation ------------------------------------------------------------------------------

function createPart(descriptor: PartDescriptor, target: Node, host?: unknown): Part {
	if (descriptor.extension) {
		return descriptor.extension.extension.createPart(
			target as Element, descriptor.extension.binding, host,
			{ literals: descriptor.literals ?? ['', ''], valueCount: descriptor.valueCount },
		);
	}
	// Attribute-like kinds all come from extensions (see above); only slots are built in.
	if (descriptor.kind === PartType.CHILD) return new ChildPart(target as Comment, host);
	return new ElementPart(target as Element, host);
}
// --- SVG namespace ------------------------------------------------------------------------------

/** Parse inside a temporary `<svg>` so the HTML parser assigns the SVG namespace, then hoist the
 *  children back so node indices line up exactly like the `'html'` path. */
const svgSupport = {
	wrapMarkup: (markup: string, type: TemplateType) => (type === 'svg' ? `<svg>${markup}</svg>` : markup),
	unwrapContent(content: DocumentFragment, type: TemplateType) {
		if (type !== 'svg') return;
		const wrapper = content.firstChild as SVGElement;
		while (wrapper.firstChild) content.appendChild(wrapper.firstChild);
		wrapper.remove();
	},
};

// --- Wiring -------------------------------------------------------------------------------------

const hooks: EngineHooks<PartDescriptor, Part, TemplateType, OpenBinding> = {
	onTextSlot: () => ({ kind: PartType.CHILD, name: '', valueCount: 1 }),
	onTagSlot: () => ({ kind: PartType.ELEMENT, name: '', valueCount: 1 }),
	onAttributeOpen: ({ rawName, markup }) => parseBinding(rawName, markup),
	onAttributeClose: (open, { literals, valueCount }) => describeBinding(open, literals, valueCount),

	wrapMarkup: svgSupport.wrapMarkup,
	unwrapContent: svgSupport.unwrapContent,
	onCompiled(template) {
		if (DEV) warnOnUndefinedElements(template.element.content);
	},

	createPart,
};

const engine = createEngine(hooks, { defaultType: 'html' });

export const getTemplate = engine.getTemplate;
export const instantiate = engine.instantiate;
