// --- std-ui's template syntax, plugged into the generic Builder. ------------------------------------
//
// `builder.ts` knows only templates, tags, attributes and lifecycle hooks. Everything specific to
// std-ui lives here, grouped by concern and wired in through `BuilderHooks`:
//
//   - binding syntax   : `.prop`, `?bool`, `@event.modifier`, plain `attr` (+ single-interpolation rules),
//                        and bare element slots `<div ${x}>`
//   - part creation    : descriptor kind -> `Part` class
//   - SVG/MathML namespace : wrap/unwrap markup meant to be interpolated into an existing `<svg>`/`<math>`
//   - dev diagnostics  : warn on undefined custom elements
//
// See `html.ts` for the overall design.

import { DEV } from '../../../dev/flag.js';
import { warnOnUndefinedElements } from './dev/warn-undefined-elements.js';
import { findCustomAttribute, type CustomAttribute, type AttributeInfo } from './custom-attribute.js';
import { registerBuiltinCustomAttributes } from '../custom-attributes/register-builtin.js';
import { createBuilder, type BuilderHooks, type SlotDescriptor, type Template as BuilderTemplate } from './builder/index.js';
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
	/** Set when a registered `CustomAttribute` handles this binding (e.g. `class.active`); it builds the part. */
	extension?: { attributeInfo: AttributeInfo; extension: CustomAttribute };
	/** `kind: PartType.ATTRIBUTE` only: the static text segments surrounding each interpolation in this
	 *  attribute's value, e.g. `class="a-${x}-b-${y}"` -> `['a-', '-b-', '']`. Always has exactly
	 *  `valueCount + 1` entries; `['', '']` for a bare `attr=${value}` with no static text. */
	literals?: string[];
	/** Number of consecutive entries of the tagged-template's `values[]` this descriptor consumes.
	 *  `1` for every kind except `attr`, which is `>= 1`. */
	valueCount: number;
}

export type Template = BuilderTemplate<PartDescriptor>;

// Explicit, idempotent registration of the built-in bindings (before any template is built).
registerBuiltinCustomAttributes();

/** `'svg'`/`'math'` wrap the built markup in a temporary `<svg>`/`<math>` during parsing so elements
 *  land in the SVG/MathML namespace. See `html.ts`'s `svg()` and `math()`. */
export type TemplateType = 'html' | 'svg' | 'math';

// --- Binding syntax -----------------------------------------------------------------------------

/** `[sigil]name[:arg](.modifier[:value])*`, the full attribute name as handed over by the Builder.
 *  Static args/values are `[\w-]+` (no `.`, which would start the next modifier); modifier names may
 *  also contain `+`, e.g. `@keyup.ctrl+enter`. See `attributes.md`. */
const BINDING_NAME_RE = /^([^\w\s"'<>\/=:-]?)([\w-]+)(?::([\w-]+))?((?:\.[\w+-]+(?::[\w-]+)?)*)$/;

interface OpenBinding {
	rawName: string;
	attributeInfo: AttributeInfo;
	extension: CustomAttribute;
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
		throw new Error(DEV ? `std-ui html: could not parse an attribute binding near "...${markup.slice(-40)}"` : 'std-ui: bad attribute binding');
	}
	const [, sigil, name, arg, rawModifiers] = match;
	const attributeInfo: AttributeInfo = { sigil, name, arg, modifiers: parseModifiers(rawModifiers) };
	const extension = findCustomAttribute(attributeInfo);
	if (!extension) {
		throw new Error(DEV ? `std-ui html: unknown binding sigil "${sigil}" in "${rawName}" - register a CustomAttribute for it.` : 'std-ui: unknown binding sigil');
	}
	extension.validate?.(attributeInfo);
	return { rawName, attributeInfo, extension };
}

function describeBinding(open: OpenBinding, literals: readonly string[], valueCount: number): PartDescriptor {
	const { attributeInfo, extension, rawName } = open;
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
		name: attributeInfo.name,
		arg: attributeInfo.arg,
		modifiers: [...attributeInfo.modifiers],
		extension: { attributeInfo, extension },
		nodeIndex: -1,
		literals: mustBeSingle ? undefined : [...literals],
		valueCount,
	};
}

// --- Part creation ------------------------------------------------------------------------------

function createPart(descriptor: PartDescriptor, target: Node, host?: unknown): Part {
	if (descriptor.extension) {
		return descriptor.extension.extension.createPart(
			target as Element, descriptor.extension.attributeInfo, host,
			{ literals: descriptor.literals ?? ['', ''], valueCount: descriptor.valueCount },
		);
	}
	// Attribute-like kinds all come from extensions (see above); only slots are built in.
	if (descriptor.kind === PartType.CHILD) return new ChildPart(target as Comment, host);
	return new ElementPart(target as Element, host);
}
// --- Foreign namespaces (SVG, MathML) -----------------------------------------------------------

/** Root tag that makes the HTML parser switch namespace for each foreign template type. */
const FOREIGN_ROOT: Partial<Record<TemplateType, string>> = { svg: 'svg', math: 'math' };

/** Parse inside a temporary `<svg>`/`<math>` so the HTML parser assigns the SVG/MathML namespace, then
 *  hoist the children back so node indices line up exactly like the `'html'` path. */
const foreignSupport = {
	wrapMarkup(markup: string, type: TemplateType) {
		const root = FOREIGN_ROOT[type];
		return root ? `<${root}>${markup}</${root}>` : markup;
	},
	unwrapContent(content: DocumentFragment, type: TemplateType) {
		if (!FOREIGN_ROOT[type]) return;
		const wrapper = content.firstChild as Element;
		while (wrapper.firstChild) content.appendChild(wrapper.firstChild);
		wrapper.remove();
	},
};

// --- Wiring -------------------------------------------------------------------------------------

const hooks: BuilderHooks<PartDescriptor, Part, TemplateType, OpenBinding> = {
	onTextSlot: () => ({ kind: PartType.CHILD, name: '', valueCount: 1 }),
	onTagSlot: () => ({ kind: PartType.ELEMENT, name: '', valueCount: 1 }),
	onAttributeOpen: ({ rawName, markup }) => parseBinding(rawName, markup),
	onAttributeClose: (open, { literals, valueCount }) => describeBinding(open, literals, valueCount),

	wrapMarkup: foreignSupport.wrapMarkup,
	unwrapContent: foreignSupport.unwrapContent,
	onBuilt(template) {
		if (DEV) warnOnUndefinedElements(template.element.content);
	},

	createPart,
};

const Builder = createBuilder(hooks, { defaultType: 'html' });

export const getTemplate = Builder.getTemplate;
export const instantiate = Builder.instantiate;
