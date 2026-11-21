import { describe, expect, it } from 'vitest';
import { tag, UIElement } from '@std-ui/core';
import { HotkeyFeat, hotkeys } from './hotkey-feat.js';

describe('hotkey feats', () => {
	it('HotkeyFeat runs handlers while connected only', () => {
		const pressed: string[] = [];

		@tag('feat-hotkey')
		class Host extends UIElement {
			readonly keys = new HotkeyFeat(this, { Escape: () => pressed.push('esc') });
		}

		const el = document.createElement('feat-hotkey') as Host;
		document.body.appendChild(el);
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
		expect(pressed).toEqual(['esc']);

		el.remove();
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(pressed).toEqual(['esc']);
	});


	it('@hotkeys() decorator applies a HotkeyFeat to every instance', () => {
		const pressed: string[] = [];

		@tag('feat-hotkeys-deco')
		@hotkeys({ Enter: () => pressed.push('enter') })
		class Host extends UIElement {}

		const el = document.createElement('feat-hotkeys-deco') as Host;
		document.body.appendChild(el);
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
		expect(pressed).toEqual(['enter']);
		el.remove();
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
		expect(pressed).toEqual(['enter']);
	});
});
