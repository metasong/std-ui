// Body of the feat demo: each section wrapped in `<code-preview>`.
import { t, tag, UIElement } from '@std-ui/core';
import '../../shared/code-preview.js';
import clock from './sections/clock-section.ts?raw';
import decorator from './sections/decorator-section.ts?raw';

import computedSkip from './sections/computed-skip-section.ts?raw';

const computedSkipFiles = { 'computed-skip-section.ts': computedSkip };
const clockFiles = { 'clock-section.ts': clock };
const decoratorFiles = { 'decorator-section.ts': decorator };

@tag('demo-feat-page')
export class DemoFeatPage extends UIElement {
	protected override template() {
		return t`
			<code-preview .files=${clockFiles}><demo-feat-clock-section></demo-feat-clock-section></code-preview>
			<code-preview .files=${decoratorFiles}><demo-feat-decorator-section></demo-feat-decorator-section></code-preview>
			<code-preview .files=${computedSkipFiles}><demo-feat-computed-skip-section></demo-feat-computed-skip-section></code-preview>
		`;
	}
}
