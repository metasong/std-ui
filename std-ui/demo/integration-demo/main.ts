// std-ui integration demo — sections here combine several features; single-feature demos live in `../feature-demo/`.
// Each section is wrapped in `<demo-code-tabs>` (see index.html); its source files are attached here via `?raw`.
import '../shared/code-tabs.js';
import './sections/signup-form-section.js';
import './sections/directory-section.js';
import { setCodeFiles } from '../shared/code-tabs.js';
import signup from './sections/signup-form-section.ts?raw';
import merged from '../feature-demo/sections/bind/validation/merged-control.ts?raw';
import range from '../feature-demo/sections/bind/validation/range-control.ts?raw';
import directory from './sections/directory-section.ts?raw';

setCodeFiles('#signup-code', {
	'signup-form-section.ts': signup,
	'merged-control.ts (FormElement)': merged,
	'range-control.ts (FormGroup)': range,
});
setCodeFiles('#directory-code', { 'directory-section.ts': directory });
