// Page body of the integration demo: each section wrapped in `<code-preview>`, with its sources passed in
// through a one-way `.files` property binding.
import { t, tag, UIElement } from '@std-ui/core';
import '../../shared/code-preview.js';
import './signup-form-section.js';
import './directory-section.js';
import signup from './signup-form-section.ts?raw';
import merged from '../../feature-demo/sections/bind/validation/merged-control.ts?raw';
import range from '../../feature-demo/sections/bind/validation/range-control.ts?raw';
import directory from './directory-section.ts?raw';

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
