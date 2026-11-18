export { t, svg, math, type TemplateResult } from './tag-funcs/html/index.js';
export { html } from './directives/html/index.js';
export { render, unmount, disconnectRendered, type RenderOptions } from './render.js';
export { Directive, directive, noChange, type DirectivePart, type PartInfo } from './directives/directive.js';
export { PartType, type Part, type Modifier } from './parts/index.js';
export { registerCustomAttribute, WILDCARD, type CustomAttribute, type AttributeInfo, type AttributeValue } from './compiler/custom-attribute.js';
export {
	css,
	unsafeCSS,
	CSSResult,
	flattenCSSResults,
	flattenCSSText,
	hostSelectorsToScope,
	type CSSResultGroup,
} from './tag-funcs/css/index.js';
