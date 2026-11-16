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
} from './ui-element.js';
export { registerUIElementHooks, type UIElementHooks, type Cleanup } from './ui-element-hooks.js';
export { createClassRegistry, ownMetadata, metadataSymbol, type ClassRegistry } from './decorators/index.js';
export {
	t,
	svg,
	render,
	html,
	Directive,
	directive,
	noChange,
	PartType,
	css,
	unsafeCSS,
	CSSResult,
	hostSelectorsToScope,
	type TemplateResult,
	type Part,
	type PartInfo,
	type CSSResultGroup,
} from './template/index.js';
export { bind, classMap, styleMap, mapByKey, slot, ref, createRef } from './template/directives/index.js';
export type { BindAccessor, BindOptions, BindSource, Ref, RefCallback, RefOrCallback } from './template/directives/index.js';
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
} from './signal/index.js';
export { Committer, commitWith } from './template/parts/committers/index.js';
export { AttributePart, ChildPart } from './template/parts/index.js';
export { KeyedRows, type KeyedEntries } from './template/directives/keyed-rows/index.js';
export { markTouched, trackTouched } from './touched.js';
