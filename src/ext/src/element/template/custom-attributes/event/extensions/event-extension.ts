import type { AttributeInfo } from '@std-ui/core';

/** May return a dispose function, run on the next event or when the part is disposed. */
export type EventHandler = (event: Event) => void | (() => void);

/** Attribute info as seen by an event extension: the sigil is always `@`, so it is dropped. */
export type EventAttributeInfo = Omit<AttributeInfo, 'sigil'>;

/** Extension for `@name.mod...`. Only the first registered extension whose `filter` passes is used. */
export interface EventExtension {
	/** Picks this extension, e.g. `info => info.name.startsWith('key') && info.modifiers.length > 0`. */
	filter(info: EventAttributeInfo): boolean;
	/** Receives the part's handler, returns the one to actually register. Called once per part. */
	handler(handler: EventHandler, info: EventAttributeInfo): EventHandler;
}

const extensions: EventExtension[] = [];

export function registerEventExtension(extension: EventExtension): void {
	extensions.push(extension);
}

export function findEventExtension(info: EventAttributeInfo): EventExtension | undefined {
	return extensions.find(e => e.filter(info));
}
