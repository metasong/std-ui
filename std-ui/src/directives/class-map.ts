import { Directive, directive, noChange, PartType, type Part, type PartInfo } from '../template/directive.js';

/**
 * Mirrors lit-html's `classMap` directive: toggles individual classes on/off via `classList`,
 * rather than recomputing the whole `class` attribute as a string. Keys with a truthy value are
 * added; keys with a falsy value are removed (and left alone if never present). Classes already on
 * the element from static markup or elsewhere are never touched.
 *
 * Must be the attribute's *only* interpolation, with no surrounding static text - same rule as
 * `?`/`.`/`@`-prefixed bindings, since this binds a live object, not a composed string:
 *
 *   html`<div class="${classMap({ active: isActive, hidden: !visible })}"></div>`
 */
class ClassMapDirective extends Directive {
	/** Classes this instance added last time, so the next `update()` knows which to remove if they
	 *  drop out or turn falsy. */
	#previous: Set<string> | undefined;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.ATTRIBUTE || partInfo.name !== 'class') {
			throw new Error('std-ui classMap(): must be bound to a "class" attribute.');
		}
	}

	/** Toggles only the classes that changed since last time via `part.element`'s `classList`,
	 *  leaving classes from elsewhere untouched, then signals there's nothing left to commit.
	 *  `classes`'s type here is what `directive()` infers `classMap`'s own argument type from -
	 *  no separate `render()` needed just for that. */
	override update(part: Part, classes: Readonly<Record<string, unknown>>): typeof noChange {
		const next = new Set(Object.keys(classes).filter(key => Boolean(classes[key])));
		if (this.#previous) for (const cls of this.#previous) if (!next.has(cls)) part.element.classList.remove(cls);
		for (const cls of next) part.element.classList.add(cls);
		this.#previous = next;
		return noChange;
	}
}

export const classMap = directive(ClassMapDirective);
