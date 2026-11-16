export { getTemplate, instantiate } from './compile.js';
export type { PartDescriptor, Template, TemplateType } from './compile.js';
export { createEngine } from './engine.js';
export type {
	SlotDescriptor,
	DescriptorInit,
	TextSlotContext,
	TagSlotContext,
	AttributeOpenContext,
	AttributeCloseContext,
	EngineHooks,
	Template as GenericTemplate,
	Engine,
	EngineOptions,
} from './engine.js';
