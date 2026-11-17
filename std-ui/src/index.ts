export {
	tag,
	attribute,
	defineElement,
	UIElement,
	type AttributeConverter,
	type AttributeOptions,
	type AttributesMap,
	type AttributeType,
	type DefineElementOptions,
} from './element/ui-element.js';
export { registerUIElementHooks, type UIElementHooks, type Cleanup } from './element/ui-element-hooks.js';
export { createClassRegistry, ownMetadata, metadataSymbol, type ClassRegistry } from './element/decorators/index.js';
export {
	t,
	svg,
	render,
	html,
	Directive,
	directive,
	noChange,
	PartType,
	registerBindingExtension,
	css,
	unsafeCSS,
	CSSResult,
	hostSelectorsToScope,
	type TemplateResult,
	type Part,
	type BindingPart,
	type BindingExtension,
	type BindingName,
	type BindingValue,
	type Modifier,
	type PartInfo,
	type CSSResultGroup,
} from './element/template/index.js';
export { bind, classMap, styleMap, mapByKey, slot, ref, createRef } from './element/template/directives/index.js';
export type { BindAccessor, BindOptions, BindSource, Ref, RefCallback, RefOrCallback } from './element/template/directives/index.js';
export {
	state,
	toSignal,
	toSignalFrom,
	computed,
	effect,
	subtle,
	type Computed,
	type DeepPartial,
	type OnCleanup,
	type SignalState,
	signal,
	type Signal,
	type SignalArray,
	type SignalObject,
	type SignalLeaf,
	type ItemNode,
	type Extendable,
	type Extension,
	type TreeNode,
	childEntries,
	deepEqual,
	EQUALS,
	extendTree,
	isTreeNode,
	type Subscribable,
	type ToSignal,
	type ToSignalOptions,
	type ToSignalFromOptions,
} from './reactive/index.js';
export { ChildRenderer, renderWith } from './element/template/parts/renderers/index.js';
export { AttributePart, ChildPart } from './element/template/parts/index.js';
export { KeyedRows, type KeyedEntries } from './element/template/directives/_lib/keyed-rows/index.js';
export { markTouched, trackTouched } from './touched.js';
