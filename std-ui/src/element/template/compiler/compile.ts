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
import { createEngine, type EngineHooks, type SlotDescriptor, type Template as EngineTemplate } from './engine.js';
// Parts import `instantiate` for nested templates; they are only touched lazily inside hooks, so
// the module cycle is harmless.
import {
	AttributePart, BooleanAttributePart, PropertyPart, EventPart, ElementPart, ChildPart,
	AttributeEntryPart, type Modifier, type Part,
} from '../parts/index.js';

export type PartKind = 'child' | 'attr' | 'bool' | 'prop' | 'event' | 'element';

export interface PartDescriptor extends SlotDescriptor {
	kind: PartKind;
	/** Attribute/property/event name, sans its `.`/`?`/`@` sigil, `:arg` and any `.modifier`s. Unused for `kind: 'child'`. */
	name: string;
	/** `kind: 'attr'` only: the `:arg` selecting one entry of a `class`/`style` attribute, e.g.
	 *  `active` in `class:active=${on}`. Absent for a whole-attribute binding. */
	arg?: string;
	/** Every parsed `.modifier[:arg]`, in source order; each kind interprets the ones it knows. */
	modifiers?: Modifier[];
	/** `kind: 'attr'` only: the static text segments surrounding each interpolation in this
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

/** `[sigil]name[:arg](.modifier[:arg])*`, the full attribute name as handed over by the engine.
 *  Static args are `[\w-]+` (no `.`, which would start the next modifier). See `compile-attributes.md`. */
const BINDING_NAME_RE = /^([.?@]?)([\w-]+)(?::([\w-]+))?((?:\.[\w-]+(?::[\w-]+)?)*)$/;

const SIGIL_KIND: Record<string, PartKind> = { '.': 'prop', '?': 'bool', '@': 'event', '': 'attr' };
const KIND_SIGIL: Record<string, string> = { prop: '.', bool: '?', event: '@' };

/** Attributes that accept `name:arg` to bind a single entry (`class:active`, `style:color`). */
const ENTRY_ATTRIBUTES = new Set(['class', 'style']);

interface OpenBinding {
	kind: PartKind;
	name: string;
	arg?: string;
	modifiers: Modifier[];
}

function parseModifiers(raw: string): Modifier[] {
	if (!raw) return [];
	return raw
		.slice(1)
		.split('.')
		.map(part => {
			const [name, arg] = part.split(':');
			return arg === undefined ? { name } : { name, arg };
		});
}

function parseBinding(rawName: string, markup: string): OpenBinding {
	const match = BINDING_NAME_RE.exec(rawName);
	if (!match) {
		throw new Error(`std-ui html: could not parse an attribute binding near "...${markup.slice(-40)}"`);
	}
	const [, sigil, name, arg, rawModifiers] = match;
	const open: OpenBinding = { kind: SIGIL_KIND[sigil], name, modifiers: parseModifiers(rawModifiers) };

	if (arg !== undefined) {
		if (sigil !== '' || !ENTRY_ATTRIBUTES.has(name)) {
			throw new Error(`std-ui html: "${rawName}" - ":arg" is only supported on class:name and style:prop bindings.`);
		}
		open.arg = arg;
	}
	return open;
}

function describeBinding(open: OpenBinding, literals: readonly string[], valueCount: number): PartDescriptor {
	const isEntry = open.arg !== undefined;
	if (open.kind !== 'attr' || isEntry) {
		const label = isEntry ? `${open.name}:${open.arg}` : `${KIND_SIGIL[open.kind]}${open.name}`;
		if (valueCount !== 1 || literals.some(s => s !== '')) {
			throw new Error(
				`std-ui html: "${label}" must bind exactly one interpolation with no static ` +
					`text, e.g. ${label}="\${value}" - only plain attributes (no sigil) support ` +
					`multiple/mixed interpolations like class="\${a} \${b}".`,
			);
		}
	}
	return {
		kind: open.kind,
		name: open.name,
		arg: open.arg,
		modifiers: open.modifiers,
		nodeIndex: -1,
		literals: open.kind === 'attr' && !isEntry ? [...literals] : undefined,
		valueCount,
	};
}

// --- Part creation ------------------------------------------------------------------------------

function createPart(descriptor: PartDescriptor, target: Node, host?: unknown): Part {
	switch (descriptor.kind) {
		case 'child': return new ChildPart(target as Comment, host);
		case 'attr':
			return descriptor.arg === undefined
				? new AttributePart(target as Element, descriptor.name, descriptor.literals, descriptor.modifiers)
				: new AttributeEntryPart(target as Element, descriptor.name as 'class' | 'style', descriptor.arg, descriptor.modifiers);
		case 'bool': return new BooleanAttributePart(target as Element, descriptor.name, descriptor.modifiers);
		case 'prop': return new PropertyPart(target as Element, descriptor.name, descriptor.modifiers);
		case 'event': return new EventPart(target as Element, descriptor.name, descriptor.modifiers, host);
		case 'element': return new ElementPart(target as Element, host);
	}
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
	onTextSlot: () => ({ kind: 'child', name: '', valueCount: 1 }),
	onTagSlot: () => ({ kind: 'element', name: '', valueCount: 1 }),
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
