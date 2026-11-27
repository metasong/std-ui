import { describe, expect, it, vi } from 'vitest';
import { Signal } from 'signal-polyfill';
import { computed, state } from '../../../reactive/index.js';
import { effect } from '../../../reactive/effect/effect.js';
import { whenFlushed } from '../../../reactive/effect/scheduler.js';
import { AttributePart, BooleanAttributePart, ChildPart, PropertyPart } from './index.js';
import { raw } from '../custom-attributes/property/index.js';
import { render } from '../render.js';
import { t } from '../tag-funcs/html/index.js';

function childPart() {
	const container = document.createElement('div');
	const anchor = document.createComment('');
	container.append(anchor);
	return { part: new ChildPart(anchor), container };
}

describe('signal bindings: ChildPart', () => {
	it('renders the signal value and patches only on change', async () => {
		const { part, container } = childPart();
		const count = state(1);
		part.update([count]);
		expect(container.textContent).toBe('1');
		count.set(2);
		await whenFlushed();
		expect(container.textContent).toBe('2');
	});

	it('swaps from one signal to another and to a plain value', async () => {
		const { part, container } = childPart();
		const a = state('a');
		const b = state('b');
		part.update([a]);
		part.update([b]);
		a.set('a2');
		await whenFlushed();
		expect(container.textContent).toBe('b');
		b.set('b2');
		await whenFlushed();
		expect(container.textContent).toBe('b2');
		part.update(['plain']);
		b.set('b3');
		await whenFlushed();
		expect(container.textContent).toBe('plain');
	});

	it('stops following after disconnect()', async () => {
		const { part, container } = childPart();
		const count = state(1);
		part.update([count]);
		part.disconnect();
		count.set(2);
		await whenFlushed();
		expect(container.textContent).toBe('1');
	});

	it('renders a signal holding a template', async () => {
		const { part, container } = childPart();
		const view = state(t`<b>a</b>`);
		part.update([view]);
		expect(container.innerHTML).toContain('<b>a</b>');
		view.set(t`<i>b</i>`);
		await whenFlushed();
		expect(container.innerHTML).toContain('<i>b</i>');
		expect(container.innerHTML).not.toContain('<b>');
	});
});

describe('signal bindings: AttributePart', () => {
	it('follows a signal and keeps plain values of a composed attribute', async () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class', ['a-', '-b-', '']);
		const x = state('x');
		part.update([x, 'y']);
		expect(el.getAttribute('class')).toBe('a-x-b-y');
		x.set('x2');
		await whenFlushed();
		expect(el.getAttribute('class')).toBe('a-x2-b-y');
		part.update([x, 'z']);
		expect(el.getAttribute('class')).toBe('a-x2-b-z');
	});
});

describe('signal bindings: BooleanAttributePart', () => {
	it('toggles the attribute when the signal changes and stops after disconnect()', async () => {
		const el = document.createElement('div');
		const part = new BooleanAttributePart(el, 'open');
		const open = state(true);
		part.update([open]);
		expect(el.hasAttribute('open')).toBe(true);
		open.set(false);
		await whenFlushed();
		expect(el.hasAttribute('open')).toBe(false);
		open.set(true);
		await whenFlushed();
		expect(el.hasAttribute('open')).toBe(true);
		part.disconnect();
		open.set(false);
		await whenFlushed();
		expect(el.hasAttribute('open')).toBe(true);
	});
});

describe('signal bindings: PropertyPart', () => {
	it('follows a signal and stops after disconnect()', async () => {
		const el = document.createElement('div') as HTMLElement & { items?: unknown };
		const part = new PropertyPart(el, 'items');
		const items = state([1]);
		part.update([items]);
		expect(el.items).toEqual([1]);
		items.set([1, 2]);
		await whenFlushed();
		expect(el.items).toEqual([1, 2]);
		part.disconnect();
		items.set([3]);
		await whenFlushed();
		expect(el.items).toEqual([1, 2]);
	});

	it('raw() hands the signal itself to the element', async () => {
		const el = document.createElement('div') as HTMLElement & { source?: unknown };
		const part = new PropertyPart(el, 'source');
		const sig = state(1);
		part.update([raw(sig)]);
		expect(el.source).toBe(sig);
		sig.set(2);
		await whenFlushed();
		expect(el.source).toBe(sig);
	});

	it('raw() is written like a plain value (a store field gets it through set())', () => {
		const el = document.createElement('div') as HTMLElement & { store?: unknown };
		const own = state<unknown>(0);
		el.store = own;
		const sig = state(1);
		new PropertyPart(el, 'store').update([raw(sig)]);
		expect(el.store).toBe(own);
		expect(own.peek()).toBe(sig);
	});
});

describe('signal bindings: template-level', () => {
	it('a signal change patches its slot without re-running the template function', async () => {
		const container = document.createElement('div');
		const count = state(1);
		const doubled = computed(() => count.get() * 2);
		const run = vi.fn();
		const view = () => {
			run();
			return t`<p>${count}</p><p id=${doubled}>${doubled}</p>`;
		};
		// Same shape as UIElement's render effect: only signals read in `view()` are dependencies.
		const dispose = effect(() => render(view(), container));
		expect(container.textContent).toBe('12');
		count.set(2);
		await whenFlushed();
		expect(container.textContent).toBe('24');
		expect(container.querySelector('[id="4"]')).not.toBeNull();
		expect(run).toHaveBeenCalledTimes(1);
		dispose();
	});

	it('nested template values own their signal parts', async () => {
		const container = document.createElement('div');
		const count = state(1);
		render(t`<h1>x</h1>${t`<p>${count}</p>`}`, container);
		count.set(5);
		await whenFlushed();
		expect(container.querySelector('p')!.textContent).toBe('5');
	});

	it('stops following once the template is unmounted', async () => {
		const container = document.createElement('div');
		const count = state(1);
		const handle = render(t`<p>${count}</p>`, container);
		handle.dispose();
		count.set(2);
		await whenFlushed();
		expect(container.textContent).toBe('');
	});
});

/** How many live consumers (effects) follow `sig`: 0 once every binding on it is released. */
const followers = (sig: object) => Signal.subtle.introspectSinks(sig as Signal.State<unknown>).length;

describe('signal bindings: teardown', () => {
	it('a list of signals follows each item, and shrinking releases the dropped ones', async () => {
		const container = document.createElement('div');
		const a = state('a');
		const b = state('b');
		const c = state('c');
		const handle = render(t`<p>${[a, b, c]}</p>`, container);
		expect(container.textContent).toBe('abc');
		expect(followers(a) + followers(b) + followers(c)).toBe(3);
		handle.update(t`<p>${[a]}</p>`);
		expect([followers(a), followers(b), followers(c)]).toEqual([1, 0, 0]);
		b.set('b2');
		await whenFlushed();
		expect(container.textContent).toBe('a');
		handle.dispose();
		expect(followers(a)).toBe(0);
	});

	it('unmounting a template releases every signal it followed (child, attribute, boolean, property)', () => {
		const container = document.createElement('div');
		const s = state('x');
		const flag = state(true);
		const handle = render(t`<p class=${s} ?hidden=${flag}>${s}</p>`, container);
		expect(followers(s)).toBe(2);
		expect(followers(flag)).toBe(1);
		handle.dispose();
		expect(followers(s)).toBe(0);
		expect(followers(flag)).toBe(0);
	});

	it('a function in an attribute slot is never called', () => {
		const el = document.createElement('div');
		const fn = vi.fn(() => 'called');
		new AttributePart(el, 'title', ['', '']).update([fn]);
		expect(fn).not.toHaveBeenCalled();
	});

	it('swapping between sig and raw(sig) on one property slot follows and unfollows', () => {
		const el = document.createElement('div') as HTMLElement & { value?: unknown };
		const part = new PropertyPart(el, 'value');
		const sig = state(1);
		part.update([sig]);
		expect(el.value).toBe(1);
		expect(followers(sig)).toBe(1);
		part.update([raw(sig)]);
		expect(followers(sig)).toBe(0);
		expect(el.value).toBe(sig);
		// Back to following. (The property still holds `sig`, a store, so the write goes through its set().)
		part.update([sig]);
		expect(followers(sig)).toBe(1);
		part.dispose();
		expect(followers(sig)).toBe(0);
	});
});

describe('signal bindings: dev warnings', () => {
	it('warns once about a function in a child position, and does not call it', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const fn = vi.fn(() => 'x');
		const { part } = childPart();
		part.update([fn]);
		part.update([fn]);
		expect(fn).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0][0])).toMatch(/function in a child position/);
		warn.mockRestore();
	});

	it('warns about raw() outside a .prop binding (child, attribute, boolean attribute)', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		childPart().part.update([raw(state(1))]);
		new AttributePart(document.createElement('div'), 'title', ['', '']).update([raw(state(1))]);
		new BooleanAttributePart(document.createElement('div'), 'open').update([raw(state(1))]);
		const messages = warn.mock.calls.map(c => String(c[0]));
		expect(messages).toHaveLength(3);
		expect(messages[0]).toMatch(/child position/);
		expect(messages[1]).toMatch(/attribute position/);
		expect(messages[2]).toMatch(/boolean attribute position/);
		warn.mockRestore();
	});

	it('does not warn for raw() in a .prop binding', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		new PropertyPart(document.createElement('div'), 'source').update([raw(state(1))]);
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe('signal bindings: reconnect', () => {
	it('every part follows again when update() runs after disconnect()', async () => {
		const el = document.createElement('div');
		const text = state('a');
		const flag = state(true);
		const child = childPart();
		const attr = new AttributePart(el, 'title', ['', '']);
		const bool = new BooleanAttributePart(el, 'open');
		const prop = new PropertyPart(el as HTMLElement & { p?: unknown }, 'p');
		const bind = () => {
			child.part.update([text]);
			attr.update([text]);
			bool.update([flag]);
			prop.update([text]);
		};
		bind();
		child.part.disconnect();
		attr.disconnect();
		bool.disconnect();
		prop.disconnect();
		expect([followers(text), followers(flag)]).toEqual([0, 0]);
		bind();
		text.set('b');
		flag.set(false);
		await whenFlushed();
		expect(child.container.textContent).toBe('b');
		expect(el.getAttribute('title')).toBe('b');
		expect(el.hasAttribute('open')).toBe(false);
		expect((el as unknown as { p?: unknown }).p).toBe('b');
	});
});
