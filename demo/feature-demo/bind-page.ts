// Body of the bind demo: each section wrapped in `<code-preview>` (section source + helper components as tabs).
import { t, tag, UIElement } from '../../std-ui/src/index.js';
import '../shared/code-preview.js';
import form from './sections/bind/form-section.ts?raw';
import custom from './sections/bind/custom-section.ts?raw';
import knob from './sections/bind/knob-control.ts?raw';
import validation from './sections/bind/validation/validation-section.ts?raw';
import merged from './sections/bind/validation/merged-control.ts?raw';
import range from './sections/bind/validation/range-control.ts?raw';

const formFiles = { 'form-section.ts': form };
const customFiles = { 'custom-section.ts': custom, 'knob-control.ts': knob };
const validationFiles = {
	'validation-section.ts': validation,
	'merged-control.ts (FormElement)': merged,
	'range-control.ts (FormGroup)': range,
};

@tag('demo-bind-page')
export class DemoBindPage extends UIElement {
	protected override template() {
		return t`
			<code-preview .files=${formFiles}><demo-bind-form-section></demo-bind-form-section></code-preview>
			<code-preview .files=${customFiles}><demo-bind-custom-section></demo-bind-custom-section></code-preview>
			<code-preview .files=${validationFiles}>
				<demo-bind-validation-section></demo-bind-validation-section>
			</code-preview>
		`;
	}
}
