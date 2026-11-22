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
export { addClassHooks, type UIElementHooks, type Cleanup } from './element/ui-element-hooks.js';
export { UIFeat } from './element/feat/index.js';
export { createClassRegistry, ownMetadata, metadataSymbol, type ClassRegistry } from './element/decorators/index.js';
export { query, queryAll, queryAsync, queryAssigned, queryAssignedNodes } from './element/decorators/index.js';
export {
	t,
	svg,
	math,
	render,
	unsafeHtml,
	Directive,
	directive,
	noChange,
	PartType,
	registerCustomAttribute,
	WILDCARD,
	css,
	unsafeCss,
	CSSResult,
	hostSelectorsToScope,
	type TemplateResult,

	type DirectivePart,
	type Part,
	type CustomAttribute,
	type AttributeInfo,
	type AttributeValue,
	type Modifier,
	type PartInfo,
	type CSSResultGroup,
} from './element/template/index.js';
export { bind, createBind, classMap, styleMap, mapByKey, slot, ref, createRef } from './element/template/directives/index.js';
export type { BindAccessor, BindOptions, BindPlugin, BindPluginContext, BindSource, Ref, RefCallback, RefOrCallback } from './element/template/directives/index.js';
export {
	toSignal,
	toSignalFrom,
	computed,
	effect,
	subtle,
	type Computed,
	type OnCleanup,
	state,
	type ReadonlyState,
	type StateOptions,
	type ToSignalSource,
	type State,
	type Subscribable,
	type ToSignal,
	type ToSignalOptions,
	type ToSignalFromOptions,
} from './reactive/index.js';
export { ChildRenderer, renderWith } from './element/template/parts/renderers/index.js';
export { AttributePart, ChildPart, EventPart, withEventOptions } from './element/template/parts/index.js';
export { KeyedRows, type KeyedEntries } from './element/template/directives/_lib/keyed-rows/index.js';