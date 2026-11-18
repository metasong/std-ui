// Body of the bind demo: each section wrapped in `<code-preview>` (section source + helper components as tabs).
import { t, tag, UIElement } from '../../core/src/index.js';
import '../shared/code-preview.js';
import form from './sections/bind/form-section.ts?raw';
import custom from './sections/bind/custom-section.ts?raw';
import knob from './sections/bind/knob-control.ts?raw';
import validation from './sections/bind/validation/validation-section.ts?raw';
import merged from './sections/bind/validation/merged-control.ts?raw';
import range from './sections/bind/validation/range-control.ts?raw';
import formUiDemo from './sections/bind/form-ui/form-ui-section.ts?raw';
import formFlagsDemo from './sections/bind/form-flags/form-flags-section.ts?raw';

const formFiles = { 'form-section.ts': form };
const customFiles = { 'custom-section.ts': custom, 'knob-control.ts': knob };
const validationFiles = {
	'validation-section.ts': validation,
	'merged-control.ts (FormElement)': merged,
	'range-control.ts (FormGroup)': range,
};
const formUiFiles = { 'form-ui-section.ts': formUiDemo };
const formFlagsFiles = { 'form-flags-section.ts': formFlagsDemo };

@tag('demo-bind-page')
export class DemoBindPage extends UIElement {
	protected override template() {
		return t`
			<code-preview .files=${formFiles}><demo-bind-form-section></demo-bind-form-section></code-preview>
			<code-preview .files=${customFiles}><demo-bind-custom-section></demo-bind-custom-section></code-preview>
			<code-preview .files=${validationFiles}>
				<demo-bind-validation-section></demo-bind-validation-section>
			</code-preview>
			<code-preview .files=${formUiFiles}><demo-bind-form-ui-section></demo-bind-form-ui-section></code-preview>
			<code-preview .files=${formFlagsFiles}>
				<demo-bind-form-flags-section></demo-bind-form-flags-section>
			</code-preview>
		`;
	}
}
