import { describe, expect, it } from 'vitest';
import { render, state, t } from '@std-ui/core';
import { check } from '../../../../reactive/state/check/index.js';
import { formUi } from '../../../../reactive/state/form-ui/index.js';
import { formBind } from './index.js';

const tick = () => new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

function setup() {
	const form = formUi(check(state({ name: 'a', nested: { age: 1 } })));
	const container = document.createElement('div');
	const view = () => t`<input .value=${formBind(form.name)} />`;
	render(view(), container);
	return { form, container, input: container.querySelector('input') as HTMLInputElement, view };
}

describe('formUi()', () => {
	it('cascades readonly / disabled to descendants, including members added later', () => {
		const form = formUi(state({ a: { b: 1 } }));
		expect(form.a.b.formUi.disabled()).toBe(false);
		form.a.formUi.disabled.own.set(true);
		expect(form.a.b.formUi.disabled()).toBe(true);
		expect(form.formUi.disabled()).toBe(false);
		form.formUi.readonly.own.set(true);
		expect(form.a.b.formUi.readonly()).toBe(true);
	});

	it('a node shared by two trees is disabled when either parent is', () => {
		const shared = state({ x: 1 });
		const a = formUi(state({ s: shared }));
		const b = formUi(state({ s: shared }));
		expect(a.s.x.formUi.disabled()).toBe(false);
		b.formUi.disabled.own.set(true);
		expect(a.s.x.formUi.disabled()).toBe(true);
	});

	it('touched() is own OR any descendant; touched.own is just this node', () => {
		const form = formUi(state({ a: { b: 1 } }));
		expect(form.formUi.touched()).toBe(false);
		form.a.b.formUi.touch();
		expect(form.formUi.touched()).toBe(true);
		expect(form.formUi.touched.own()).toBe(false);
		form.formUi.untouchAll();
		expect(form.formUi.touched()).toBe(false);
		form.formUi.touchAll();
		expect(form.a.b.formUi.touched()).toBe(true);
	});
});

describe('formBind()', () => {
	it('still syncs the value both ways', () => {
		const { form, input } = setup();
		expect(input.value).toBe('a');
		input.value = 'z';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(form.name()).toBe('z');
	});

	it('reflects disabled and readonly from state, and restores on clear', async () => {
		const { form, input } = setup();
		form.name.formUi.disabled.own.set(true);
		await tick();
		expect(input.disabled).toBe(true);
		form.name.formUi.disabled.own.set(false);
		await tick();
		expect(input.disabled).toBe(false);
		form.formUi.readonly.own.set(true); // from the root: cascades
		await tick();
		expect(input.readOnly).toBe(true);
		expect(input.getAttribute('aria-readonly')).toBe('true');
		form.formUi.readonly.own.set(false);
		await tick();
		expect(input.readOnly).toBe(false);
	});

	it('focusout touches the state, which shows as [touched]; untouch clears it', async () => {
		const { form, input } = setup();
		expect(input.hasAttribute('touched')).toBe(false);
		input.dispatchEvent(new Event('focusout'));
		await tick();
		expect(form.name.formUi.touched()).toBe(true);
		expect(input.hasAttribute('touched')).toBe(true);
		form.name.formUi.untouch();
		await tick();
		expect(input.hasAttribute('touched')).toBe(false);
	});

	it('mirrors check errors into setCustomValidity', async () => {
		const { form, input } = setup();
		form.name.check.validators.set([(v) => (v === 'bad' ? { flag: 'customError' as const, message: 'nope' } : undefined)]);
		form.name.set('bad');
		await tick();
		expect(input.validationMessage).toBe('nope');
		form.name.set('ok');
		await tick();
		expect(input.validationMessage).toBe('');
	});
});
