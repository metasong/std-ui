import { describe, expect, it, vi } from 'vitest';
import { EventPart, withEventOptions } from './event-part.js';

describe('EventPart once', () => {
	/** An EventPart whose options come from the handler's own `options` (the base-class path). */
	function setup() {
		const el = document.createElement('button');
		const part = new EventPart(el, 'click');
		return { el, part };
	}

	it('does not re-arm a fired `once` listener on re-render', () => {
		const { el, part } = setup();
		const spy = vi.fn();
		const handler = withEventOptions(() => spy(), { once: true });

		part.update([handler]);
		el.click();
		expect(spy).toHaveBeenCalledTimes(1);

		part.update([withEventOptions(() => spy(), { once: true })]); // re-render with a fresh handler
		el.click();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('re-enables the listener when the binding stops being `once`', () => {
		const { el, part } = setup();
		const spy = vi.fn();
		part.update([withEventOptions(() => spy(), { once: true })]);
		el.click();

		part.update([() => spy()]);
		el.click();
		el.click();
		expect(spy).toHaveBeenCalledTimes(3);
	});
});

describe('withEventOptions', () => {
	it('does not mutate the handler passed in', () => {
		const fn = () => {};
		const wrapped = withEventOptions(fn, { once: true });
		expect((fn as { options?: unknown }).options).toBeUndefined();
		expect(wrapped.options).toEqual({ once: true });
	});

	it('forwards `this` and the event to the original handler', () => {
		const calls: unknown[] = [];
		const host = {};
		const fn = function (this: unknown, e: Event) { calls.push(this, e); };
		const wrapped = withEventOptions(fn, { passive: true });
		const event = new Event('x');
		(wrapped as (this: unknown, e: Event) => void).call(host, event);
		expect(calls).toEqual([host, event]);
	});

	it('wraps listener objects', () => {
		const handleEvent = vi.fn();
		const wrapped = withEventOptions({ handleEvent }, { capture: true });
		const event = new Event('x');
		wrapped.handleEvent(event);
		expect(handleEvent).toHaveBeenCalledWith(event);
		expect(wrapped.options).toEqual({ capture: true });
	});
});
