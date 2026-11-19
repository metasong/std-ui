// Page body of the integration demo: each section wrapped in `<code-preview>`, with its sources passed in
// through a one-way `.files` property binding.
import { t, tag, UIElement } from '@std-ui/core';
import '../../shared/code-preview.js';
import './sections/signup-form-section.js';
import './sections/directory-section.js';
import signup from './sections/signup-form-section.ts?raw';
import merged from '../bind/sections/validation/merged-control.ts?raw';
import range from '../bind/sections/validation/range-control.ts?raw';
import directory from './sections/directory-section.ts?raw';

const signupFiles = {
	'signup-form-section.ts': signup,
	'merged-control.ts (FormElement)': merged,
	'range-control.ts (FormGroup)': range,
};
const directoryFiles = { 'directory-section.ts': directory };

@tag('demo-integration-page')
export class DemoIntegrationPage extends UIElement {
	protected override template() {
		return t`
			<code-preview .files=${signupFiles}>
				<demo-integration-signup></demo-integration-signup>
			</code-preview>
			<code-preview .files=${directoryFiles}>
				<demo-integration-directory></demo-integration-directory>
			</code-preview>
		`;
	}
}
