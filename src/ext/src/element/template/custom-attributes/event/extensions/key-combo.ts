import { registerEventExtension } from './event-extension.js';

const MODS = ['ctrl', 'shift', 'alt', 'meta'] as const;
const isCombo = (name: string) => name.includes('+') || (MODS as readonly string[]).includes(name);

/** `@keyup.ctrl+enter.shift+y`: runs when ANY of the combos matches. Each combo is `mod+...+key`. */
registerEventExtension({
	filter: info => info.name.startsWith('key') && info.modifiers.some(m => m.value === undefined && isCombo(m.name)),
	handler(handler, info) {
		const combos = info.modifiers.filter(m => isCombo(m.name)).map(m => {
			const parts = m.name.toLowerCase().split('+');
			const key = parts.pop()!;
			return { key, mods: new Set(parts) };
		});
		return function (this: unknown, event: Event) {
			const e = event as KeyboardEvent;
			const ok = combos.some(c =>
				c.key === e.key.toLowerCase() &&
				MODS.every(m => c.mods.has(m) === e[`${m}Key`]));
			if (ok) return handler.call(this, event);
		};
	},
});
