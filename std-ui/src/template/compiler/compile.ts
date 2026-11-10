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

import { DEV, warnOnUndefinedElements } from '../../dev/index.js';
import { createEngine, type EngineHooks, type SlotDescriptor, type Template as EngineTemplate } from './engine.js';
// Parts import `instantiate` for nested templates; they are only touched lazily inside hooks, so
// the module cycle is harmless.
import { AttributePart, BooleanAttributePart, PropertyPart, EventPart, ElementPart, ChildPart, type Part } from '../parts/index.js';

export type PartKind = 'child' | 'attr' | 'bool' | 'prop' | 'event' | 'element';

export interface PartDescriptor extends SlotDescriptor {
	kind: PartKind;
	/** Attribute/property/event name, sans its `.`/`?`/`@` sigil and any `.modifier`s. Unused for `kind: 'child'`. */
	name: string;
	/** `kind: 'event'` only: parsed from `.capture`/`.once`/`.passive` modifiers, e.g. `@click.once.capture="${h}"`. */
	options?: AddEventListenerOptions;
	/** `kind: 'attr'` only: the static text segments surrounding each interpolation in this
	 *  attribute's value, e.g. `class="a-${x}-b-${y}"` -> `['a-', '-b-', '']`. Always has exactly
	 *  `valueCount + 1` entries; `['', '']` for a bare `attr="${value}"` with no static text. */
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

const EVENT_MODIFIERS = ['capture', 'once', 'passive'] as const;
type EventModifier = (typeof EVENT_MODIFIERS)[number];

/** `[sigil][name][.modifier...]`, the full attribute name as handed over by the engine. */
const BINDING_NAME_RE = /^([.?@]?)([\w-]+(?:\.[\w-]+)*)$/;

const SIGIL_KIND: Record<string, PartKind> = { '.': 'prop', '?': 'bool', '@': 'event', '': 'attr' };
const KIND_SIGIL: Record<string, string> = { prop: '.', bool: '?', event: '@' };

interface OpenBinding {
	kind: PartKind;
	name: string;
	options?: AddEventListenerOptions;
}

function parseEventModifiers(raw: string): { name: string; options: AddEventListenerOptions } {
	const [name, ...modifiers] = raw.split('.');
	const options: AddEventListenerOptions = {};
	for (const mod of modifiers) {
		if ((EVENT_MODIFIERS as readonly string[]).includes(mod)) options[mod as EventModifier] = true;
	}
	return { name, options };
}

function parseBinding(rawName: string, markup: string): OpenBinding {
	const match = BINDING_NAME_RE.exec(rawName);
	if (!match) {
		throw new Error(`std-ui html: could not parse an attribute binding near "...${markup.slice(-40)}"`);
	}
	const [, sigil, raw] = match;
	const kind = SIGIL_KIND[sigil];
	if (kind === 'event') return { kind, ...parseEventModifiers(raw) };
	return { kind, name: raw };
}

function describeBinding(open: OpenBinding, literals: readonly string[], valueCount: number): PartDescriptor {
	if (open.kind !== 'attr') {
		const sigil = KIND_SIGIL[open.kind];
		if (valueCount !== 1 || literals.some(s => s !== '')) {
			throw new Error(
				`std-ui html: "${sigil}${open.name}" must bind exactly one interpolation with no static ` +
					`text, e.g. ${sigil}${open.name}="\${value}" - only plain attributes (no sigil) support ` +
					`multiple/mixed interpolations like class="\${a} \${b}".`,
			);
		}
	}
	return {
		kind: open.kind,
		name: open.name,
		options: open.options,
		nodeIndex: -1,
		literals: open.kind === 'attr' ? [...literals] : undefined,
		valueCount,
	};
}

// --- Part creation ------------------------------------------------------------------------------

function createPart(descriptor: PartDescriptor, target: Node): Part {
	switch (descriptor.kind) {
		case 'child': return new ChildPart(target as Comment);
		case 'attr': return new AttributePart(target as Element, descriptor.name, descriptor.literals);
		case 'bool': return new BooleanAttributePart(target as Element, descriptor.name);
		case 'prop': return new PropertyPart(target as Element, descriptor.name);
		case 'event': return new EventPart(target as Element, descriptor.name, descriptor.options);
		case 'element': return new ElementPart(target as Element);
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
