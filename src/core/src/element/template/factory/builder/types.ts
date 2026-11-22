// --- Builder contract: descriptors, hook contexts, hooks, and public Builder types ---------------------
//
// Lifecycle (hooks in [brackets]):
//
//   build(strings, type)
//     for each interpolation:
//        text position      -> [onTextSlot]                      -> descriptor
//        tag position       -> [onTagSlot]                       -> descriptor (`<div ${x}>`, no name)
//        attribute position -> [onAttributeOpen]   (at opening quote)
//                              ... extra interpolations just extend the same attribute ...
//                              [onAttributeClose]  (at closing quote) -> descriptor
//     [wrapMarkup] -> HTML parse -> [unwrapContent]
//     Builder assigns each descriptor its `nodeIndex` and strips attribute placeholders
//     [onBuilt]
//
//   instantiate(template)
//     clone content -> resolve descriptor.nodeIndex to real nodes -> [createPart] per descriptor
//     [onInstantiated]

/** What the Builder itself needs from a descriptor; hooks may add anything else they like. */
export interface SlotDescriptor {
	/** Position of the slot's node among all element/comment nodes in document order. Set by the Builder. */
	nodeIndex: number;
	/** Number of consecutive interpolation values this slot consumes, in source order. */
	valueCount: number;
}

/** Descriptor as returned by hooks: the Builder fills in `nodeIndex`. */
export type DescriptorInit<D extends SlotDescriptor> = Omit<D, 'nodeIndex'> & { nodeIndex?: number };

export interface TextSlotContext {
	/** Markup accumulated so far (everything before this interpolation). */
	readonly markup: string;
}

export interface TagSlotContext {
	/** Markup accumulated so far; ends inside an open tag, e.g. `<div class="a" `. */
	readonly markup: string;
}

export interface AttributeOpenContext {
	/** The attribute's full name exactly as written, including any prefix/suffix characters. */
	readonly rawName: string;
	readonly quote: string;
	/** Static text between the opening quote and the first interpolation. */
	readonly prefix: string;
	/** Markup accumulated so far, for error messages. */
	readonly markup: string;
}

export interface AttributeCloseContext {
	/** Static text segments around the interpolations; always `valueCount + 1` entries. */
	readonly literals: readonly string[];
	readonly valueCount: number;
}

export interface BuilderHooks<D extends SlotDescriptor, Part, Type extends string = string, Open = unknown> {
	/** An interpolation in text position (between tags). */
	onTextSlot(ctx: TextSlotContext): DescriptorInit<D>;

	/** An interpolation inside an open tag but not in a `name="..."` value, e.g. `<div ${x}>`.
	 *  Optional: without it such templates are rejected. */
	onTagSlot?(ctx: TagSlotContext): DescriptorInit<D>;

	/** An attribute value's first interpolation was reached. Returns hook-private state for that attribute. */
	onAttributeOpen(ctx: AttributeOpenContext): Open;
	/** The attribute's closing quote was reached. Validate and produce the descriptor. */
	onAttributeClose(open: Open, ctx: AttributeCloseContext): DescriptorInit<D>;

	/** Last chance to change the markup string before it is parsed (e.g. wrap it for a namespace). */
	wrapMarkup?(markup: string, type: Type): string;
	/** Undo `wrapMarkup` on the parsed content, so node indices match the unwrapped markup. */
	unwrapContent?(content: DocumentFragment, type: Type): void;
	/** Template fully built and indexed (dev checks, extra analysis...). */
	onBuilt?(template: Template<D>, type: Type): void;

	/** Create the runtime part for one descriptor, bound to its resolved node in a fresh clone. */
	createPart(descriptor: D, node: Node, host?: unknown): Part;
	/** A fresh clone has all its parts created. */
	onInstantiated?(fragment: DocumentFragment, parts: Part[]): void;
}

/** A built template, cached per `strings` identity and type. */
export interface Template<D extends SlotDescriptor = SlotDescriptor> {
	/** Parsed markup with markers in place of interpolations; cloned on each instantiation. */
	element: HTMLTemplateElement;
	/** One descriptor per interpolation, in source order. */
	parts: D[];
}

export interface Builder<D extends SlotDescriptor, Part, Type extends string> {
	/** Cached build, keyed by the `strings` identity and `type`. */
	getTemplate(strings: TemplateStringsArray, type?: Type): Template<D>;
	instantiate(template: Template<D>, host?: unknown): { fragment: DocumentFragment; parts: Part[] };
}

export interface BuilderOptions<Type extends string> {
	/** Marker used for both text-slot comments and attribute placeholders. Default `'std-ui-part'`. */
	marker?: string;
	defaultType: Type;
}
