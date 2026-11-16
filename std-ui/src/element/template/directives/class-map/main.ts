import { Directive, directive, noChange, type AttributePartInfo, type PartInfo } from '../../directive.js';
import { PartType } from '../../parts/part.js';

/**
 * `classMap` directive: toggles individual classes on/off via `classList`,
 * rather than recomputing the whole `class` attribute as a string. Keys with a truthy value are
 * added; keys with a falsy value are removed (and left alone if never present). Classes already on
 * the element from static markup or elsewhere are never touched.
 *
 * May be used as the attribute's only interpolation, or mixed with static text/other classes (see
 * `update()` below) - unlike `?`/`.`/`@`-prefixed bindings, which must be a single bare
 * interpolation since those bind a live value, not a composed string:
 *
 *   t`<div class="${classMap({ active: isActive, hidden: !visible })} static-class"></div>`
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

	/**
	 * Toggles only the classes that changed since last time via `part.element`'s `classList`,
	 * leaving classes from elsewhere untouched, then signals there's nothing left to commit.
	 *
	 * If `part.staticText` is set (`classMap()` is mixed with static text/other classes in the same
	 * `class` attribute - see `AttributePartInfo.staticText` in `../../directive.js`), it's tokenized
	 * the same whitespace-separated way a real `class` attribute would and unioned with this call's
	 * own truthy keys before diffing, so neither contribution clobbers the other.
	 */
	override update(part: AttributePartInfo, classes: Readonly<Record<string, unknown>>): typeof noChange {
		// 1. Build the target set: truthy keys from this call's object, then union static `class` tokens.
		const next = new Set(Object.keys(classes).filter(key => Boolean(classes[key])));
		if (part.staticText) {
			for (const token of part.staticText.split(/\s+/)) {
				if (token) next.add(token);
			}
		}
		const element = part.element;
		const previous = this.#previous;
		// 2. Remove classes this instance added last time but no longer want.
		if (previous) for (const cls of previous) if (!next.has(cls)) element.classList.remove(cls);
		// 3. Add every class in `next` via `classList`.
		for (const cls of next) element.classList.add(cls);
		// 4. Remember classes for the next diff; attribute commit is skipped via `noChange`.
		this.#previous = new Set(next);
		return noChange;
	}
}

export const classMap = directive(ClassMapDirective);
