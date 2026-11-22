export { getTemplate, instantiate } from './factory.js';
export type { PartDescriptor, Template, TemplateType } from './factory.js';
export { createBuilder } from './builder/index.js';
export type {
	SlotDescriptor,
	DescriptorInit,
	TextSlotContext,
	TagSlotContext,
	AttributeOpenContext,
	AttributeCloseContext,
	BuilderHooks,
	Template as GenericTemplate,
	Builder,
	BuilderOptions,
} from './builder/index.js';
