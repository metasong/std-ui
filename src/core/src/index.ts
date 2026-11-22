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
export { query, queryAll, queryAsync, querySlotted, querySlottedNodes, getSlotContent, snapshotLightChildren, type QuerySlottedOptions } from './element/decorators/index.js';
export {
	t,
	svg,
	math,
	render,
	unsafeHtml,
	Directive,
	type DirectiveResult,
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
export { bind, createBind, classMap, styleMap, mapByKey, ref, createRef } from './element/template/directives/index.js';
export type { BindAccessor, BindOptions, BindPlugin, BindPluginContext, BindSource, Ref, RefCallback, RefOrCallback } from './element/template/directives/index.js';
export {
	computed,
	effect,
	subtle,
	type Computed,
	type OnCleanup,
	state,
	type ReadonlyState,
	type StateOptions,
	type State,
} from './reactive/index.js';
export { ChildRenderer, TemplateRenderer, renderWith } from './element/template/parts/renderers/index.js';
export { AttributePart, ChildPart, EventPart, withEventOptions } from './element/template/parts/index.js';
export { KeyedRows, type KeyedEntries } from './element/template/directives/_lib/keyed-rows/index.js';
export { DEV } from './dev/flag.js';
export { once } from './dev/once.js';
