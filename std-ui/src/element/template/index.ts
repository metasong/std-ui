export { t, svg, type TemplateResult } from './tag-funcs/html/index.js';
export { html } from './directives/html/index.js';
export { render, unmount, disconnectRendered, type RenderOptions } from './render.js';
export { Directive, directive, noChange, type Part, type PartInfo } from './directives/directive.js';
export { PartType, type Part as BindingPart, type Modifier } from './parts/index.js';
export { registerBindingExtension, type BindingExtension, type BindingName, type BindingValue } from './compiler/binding-extension.js';
export {
	css,
	unsafeCSS,
	CSSResult,
	flattenCSSResults,
	flattenCSSText,
	hostSelectorsToScope,
	type CSSResultGroup,
} from './tag-funcs/css/index.js';
