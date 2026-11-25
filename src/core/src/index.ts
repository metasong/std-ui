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
	type Rendered,
	type RenderOptions,

	type DirectivePart,
	type Part,
	type CustomAttribute,
	type AttributeInfo,
	type AttributeValue,
	type Modifier,
	type PartInfo,
	type CSSResultGroup,
} from './element/template/index.js';
export { bind, createBind, classMap, styleMap, ref, createRef } from './element/template/directives/index.js';
export type { BindAccessor, BindOptions, BindPlugin, BindPluginContext, BindSource, Ref, RefCallback, RefOrCallback } from './element/template/directives/index.js';
export {
	computed,
	effect,
	subtle,
	Computed,
	isState,
	type OnCleanup,
	state,
	type ReadableState,
	type WritableState,
	isWritableState,
	type StateOptions,
	State,
} from './reactive/index.js';
export { ChildRenderer, TemplateRenderer, renderWith } from './element/template/parts/child-renderers/index.js';
export { AttributePart, ChildPart, EventPart, EVENT_OPTIONS, withEventOptions } from './element/template/parts/index.js';
export { DEV } from './dev/flag.js';
export { once } from './dev/once.js';
export { assertChildPart } from './element/template/directives/assert-child-part.js';
