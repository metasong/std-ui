// `HotkeyFeat`: example `UIFeat` - runs handlers for `KeyboardEvent.key` values while the host is connected.
//
//   class Dialog extends UIElement {
//     readonly #hotkeys = new HotkeyFeat(this, { Escape: () => this.close() });
//   }

import { UIFeat, type UIElement } from '@std-ui/core';

export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

export class HotkeyFeat<H extends UIElement = UIElement> extends UIFeat<H> {
	readonly #keys: HotkeyMap;
	readonly #target: EventTarget;

	/** @param target Where to listen; defaults to the host (so the host or a focused descendant receives keys). */
	constructor(host: H, keys: HotkeyMap, target: EventTarget = host) {
		super(host);
		this.#keys = keys;
		this.#target = target;
	}

	protected override connected() {
		const listener = (event: Event) => {
			const handler = this.#keys[(event as KeyboardEvent).key];
			handler?.(event as KeyboardEvent);
		};
		this.#target.addEventListener('keydown', listener);
		return () => this.#target.removeEventListener('keydown', listener);
	}
}

/**
 * Class decorator: every instance of the class handles keys while connected. List it below @tag().
 *
 *   @tag('x-dialog')
 *   @hotkeys({ Escape: (e) => e.target.close() })
 *   class Dialog extends UIElement {}
 */
export function hotkeys(keys: HotkeyMap) {
	return function <T extends abstract new (...args: any[]) => UIElement>(_ctor: T, context: ClassDecoratorContext): void {
		UIFeat.attachTo(context.metadata ?? {}, host => new HotkeyFeat(host, keys));
	};
}
