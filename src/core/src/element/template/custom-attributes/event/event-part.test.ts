import { describe, expect, it, vi } from 'vitest';
import { EVENT_OPTIONS, EventPart, withEventOptions } from './event-part.js';

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
	it('returns the same handler with a static `options` property', () => {
		const fn = () => {};
		const tagged = withEventOptions(fn, { once: true });
		expect(tagged).toBe(fn);
		expect(tagged[EVENT_OPTIONS]).toEqual({ once: true });
		const listener = { handleEvent: () => {} };
		expect(withEventOptions(listener, { capture: true })).toBe(listener);
		expect((listener as any)[EVENT_OPTIONS]).toEqual({ capture: true });
	});

	it('applies the options to every binding of that handler', () => {
		const spy = vi.fn();
		const handler = withEventOptions(() => spy(), { once: true });
		for (const el of [document.createElement('button'), document.createElement('button')]) {
			new EventPart(el, 'click').update([handler]);
			el.click();
			el.click();
		}
		expect(spy).toHaveBeenCalledTimes(2); // once per element
	});

	it('returns the same handler when re-tagged with equal options', () => {
		const fn = () => {};
		const first = withEventOptions(fn, { once: true });
		expect(withEventOptions(fn, { once: true })).toBe(first);
	});

	it('wraps (and leaves the original alone) when already tagged with different options', () => {
		const calls: unknown[] = [];
		const host = {};
		const fn = function (this: unknown, e: Event) { calls.push(this, e); };
		withEventOptions(fn, { once: true });
		const wrapped = withEventOptions(fn, { passive: true });
		expect(wrapped).not.toBe(fn);
		expect((fn as any)[EVENT_OPTIONS]).toEqual({ once: true });
		expect(wrapped[EVENT_OPTIONS]).toEqual({ passive: true });
		const event = new Event('x');
		(wrapped as (this: unknown, e: Event) => void).call(host, event);
		expect(calls).toEqual([host, event]);
	});

	it('wraps listener objects already tagged with different options', () => {
		const handleEvent = vi.fn();
		const listener = { handleEvent };
		withEventOptions(listener, { once: true });
		const wrapped = withEventOptions(listener, { capture: true });
		expect(wrapped).not.toBe(listener);
		const event = new Event('x');
		wrapped.handleEvent(event);
		expect(handleEvent).toHaveBeenCalledWith(event);
		expect((listener as any)[EVENT_OPTIONS]).toEqual({ once: true });
	});

	it('applies options to listener objects', () => {
		const el = document.createElement('button');
		const handleEvent = vi.fn();
		new EventPart(el, 'click').update([withEventOptions({ handleEvent }, { once: true })]);
		el.click();
		el.click();
		expect(handleEvent).toHaveBeenCalledTimes(1);
	});
});
