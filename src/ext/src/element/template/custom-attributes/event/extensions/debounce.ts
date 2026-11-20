import { registerEventExtension } from './event-extension.js';

/** `@input.debounce` (300ms) or `@input.debounce:150`. Each call returns a dispose that cancels
 *  its timer; the part runs it when the next event arrives (that is the debounce) or on dispose. */
registerEventExtension({
	filter: info => info.modifiers.some(m => m.name === 'debounce'),
	handler(handler, info) {
		const raw = info.modifiers.find(m => m.name === 'debounce')?.value;
		const ms = raw === undefined || raw === '' || Number.isNaN(Number(raw)) ? 300 : Number(raw);
		return function (this: unknown, event: Event) {
			const timer = setTimeout(() => handler.call(this, event), ms);
			return () => clearTimeout(timer);
		};
	},
});
