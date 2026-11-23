import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, t } from '@std-ui/core';
import '../../register.js';

function mount(result: ReturnType<typeof t>) {
	const container = document.createElement('div');
	render(result, container);
	return { container, el: container.firstElementChild as HTMLElement };
}

const key = (el: HTMLElement, init: KeyboardEventInit) => el.dispatchEvent(new KeyboardEvent('keyup', init));

describe('@event.debounce', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('fires once after the last event', () => {
		const fn = vi.fn();
		const { el } = mount(t`<input @input.debounce:100=${fn} />`);
		el.dispatchEvent(new Event('input'));
		vi.advanceTimersByTime(60);
		el.dispatchEvent(new Event('input'));
		vi.advanceTimersByTime(60);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(40);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('defaults to 300ms', () => {
		const fn = vi.fn();
		const { el } = mount(t`<input @input.debounce=${fn} />`);
		el.dispatchEvent(new Event('input'));
		vi.advanceTimersByTime(299);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('cancels the pending call when the part is disposed', () => {
		const fn = vi.fn();
		const { container, el } = mount(t`<input @input.debounce:100=${fn} />`);
		el.dispatchEvent(new Event('input'));
		render(t``, container); // tears the template down
		vi.advanceTimersByTime(500);
		expect(fn).not.toHaveBeenCalled();
	});
});

describe('@keyup.mod+key', () => {
	it('runs only for a matching combo', () => {
		const fn = vi.fn();
		const { el } = mount(t`<input @keyup.ctrl+enter.shift+y=${fn} />`);
		key(el, { key: 'Enter' });
		key(el, { key: 'Enter', ctrlKey: true, shiftKey: true }); // extra modifier
		expect(fn).not.toHaveBeenCalled();
		key(el, { key: 'Enter', ctrlKey: true });
		expect(fn).toHaveBeenCalledTimes(1);
		key(el, { key: 'Y', shiftKey: true });
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('does not warn about the combo modifiers', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		mount(t`<input @keyup.alt+k=${() => {}} />`);
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe('extension selection', () => {
	it('without a match, built-in modifiers still work', () => {
		const fn = vi.fn();
		const { el } = mount(t`<button @click.once=${fn}></button>`);
		el.click();
		el.click();
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
