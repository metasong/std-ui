import { describe, expect, it } from 'vitest';
import { render, t } from '@std-ui/core';
import { stateTree } from '../../../../reactive/state-tree/index.js';
import { asyncValidator, check, required } from '../../../../reactive/state-tree/check/index.js';
import { changes } from '../../../../reactive/state-tree/changes/index.js';
import { formUi } from '../../../../reactive/state-tree/form-ui/index.js';
import { formBind } from './index.js';

const tick = () => new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

function setup() {
	const form = formUi(check(stateTree({ name: 'a', nested: { age: 1 } })));
	const container = document.createElement('div');
	const view = () => t`<input .value=${formBind(form.name)} />`;
	render(view(), container);
	return { form, container, input: container.querySelector('input') as HTMLInputElement, view };
}

describe('formUi()', () => {
	it('cascades readonly / disabled to descendants, including members added later', () => {
		const form = formUi(stateTree({ a: { b: 1 } }));
		expect(form.a.b.formUi.disabled()).toBe(false);
		form.a.formUi.disabled.own.set(true);
		expect(form.a.b.formUi.disabled()).toBe(true);
		expect(form.formUi.disabled()).toBe(false);
		form.formUi.readonly.own.set(true);
		expect(form.a.b.formUi.readonly()).toBe(true);
	});

	it('a node shared by two trees is disabled when either parent is', () => {
		const shared = stateTree({ x: 1 });
		const a = formUi(stateTree({ s: shared }));
		const b = formUi(stateTree({ s: shared }));
		expect(a.s.x.formUi.disabled()).toBe(false);
		b.formUi.disabled.own.set(true);
		expect(a.s.x.formUi.disabled()).toBe(true);
	});

	it('touched() is own OR any descendant; touched.own is just this node', () => {
		const form = formUi(stateTree({ a: { b: 1 } }));
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

	it('focusout touches the state, which shows as [data-touched]; untouch clears it', async () => {
		const { form, input } = setup();
		expect(input.hasAttribute('data-touched')).toBe(false);
		input.dispatchEvent(new Event('focusout'));
		await tick();
		expect(form.name.formUi.touched()).toBe(true);
		expect(input.hasAttribute('data-touched')).toBe(true);
		form.name.formUi.untouch();
		await tick();
		expect(input.hasAttribute('data-touched')).toBe(false);
	});

	it('shows changes.dirty as [data-dirty]', async () => {
		const form = changes(stateTree({ name: 'a' }));
		const container = document.createElement('div');
		render(t`<input .value=${formBind(form.name)} />`, container);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('data-dirty')).toBe(false);
		form.name.set('b');
		await tick();
		expect(input.hasAttribute('data-dirty')).toBe(true);
		form.name.changes.reset();
		await tick();
		expect(input.hasAttribute('data-dirty')).toBe(false);
	});

	it('shows check.pending as [data-pending] and aria-busy while an async validator waits', async () => {
		const { form, input } = setup();
		form.name.check.validators.set([asyncValidator<string>(async () => null, { debounce: 0 })]);
		await tick();
		expect(input.hasAttribute('data-pending')).toBe(true);
		expect(input.getAttribute('aria-busy')).toBe('true');
		await new Promise((r) => setTimeout(r, 20));
		expect(input.hasAttribute('data-pending')).toBe(false);
		expect(input.hasAttribute('aria-busy')).toBe(false);
	});

	it('sets aria-required while a required() validator is on the node', async () => {
		const { form, input } = setup();
		expect(input.hasAttribute('aria-required')).toBe(false);
		form.name.check.validators.set([required()]);
		await tick();
		expect(input.getAttribute('aria-required')).toBe('true');
		expect(input.required).toBe(false);
		form.name.check.validators.set([]);
		await tick();
		expect(input.hasAttribute('aria-required')).toBe(false);
	});

	it('sets aria-invalid and the aria-errormessage text from check errors', async () => {
		const { form, container, input } = setup();
		const message = document.createElement('span');
		message.id = 'name-error';
		container.append(message);
		document.body.append(container);
		input.setAttribute('aria-errormessage', 'name-error');
		form.name.check.validators.set([(v) => (v === 'bad' ? { flag: 'customError' as const, message: 'nope' } : undefined)]);
		form.name.set('bad');
		await tick();
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(message.textContent).toBe('nope');
		form.name.set('ok');
		await tick();
		expect(input.hasAttribute('aria-invalid')).toBe(false);
		expect(message.textContent).toBe('');
		container.remove();
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
