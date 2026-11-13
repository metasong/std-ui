// Body of the slot demo: each section wrapped in `<code-preview>`.
import { t, tag, UIElement } from '../../src/index.js';
import '../shared/code-preview.js';
import light from './sections/slot/light-section.ts?raw';
import shadow from './sections/slot/shadow-section.ts?raw';

const lightFiles = { 'light-section.ts': light };
const shadowFiles = { 'shadow-section.ts': shadow };

@tag('demo-slot-page')
export class DemoSlotPage extends UIElement {
	protected override template() {
		return t`
			<code-preview .files=${lightFiles}><demo-slot-light-section></demo-slot-light-section></code-preview>
			<code-preview .files=${shadowFiles}><demo-slot-shadow-section></demo-slot-shadow-section></code-preview>
		`;
	}
}
