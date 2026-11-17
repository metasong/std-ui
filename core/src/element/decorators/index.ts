export { tag, defineElement, type AttributesMap, type DefineElementOptions } from './tag/index.js';
export {
	query,
	queryAll,
	queryAsync,
	queryAssignedNodes,
	queryElement,
	queryElements,
	queryElementAsync,
	queryAssigned,
	type QueryAssignedOptions,
} from './query/index.js';
export { attribute, type AttributeOptions } from './attribute/attribute.decorator.js';
export { type AttributeConverter, type AttributeType } from './attribute/converter.js';
export { parseAttribute, serializeAttribute } from './attribute/converter.js';
export {
	defineObservedAttributes,
	attributeDefs,
	resolveInferredConverter,
	type AttributeDef,
} from './attribute/metadata.js';
export { wireReflectedAttributes } from './attribute/wire-reflect.js';
export { createClassRegistry, ownMetadata, metadataSymbol, type ClassRegistry } from './class-registry.js';
