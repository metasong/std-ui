// Body of the router demo: each section wrapped in `<code-preview>`.
import { t, tag, UIElement } from '@std-ui/core';
import '../shared/code-preview.js';
import announcer from './sections/router/announcer-section.ts?raw';
import full from './sections/router/app-section.ts?raw';
import pages from './sections/router/pages.ts?raw';
import viewTransition from './sections/router/view-transition-section.ts?raw';

const fullFiles = { 'app-section.ts': full };
const announcerFiles = { 'announcer-section.ts': announcer, 'pages.ts': pages };
const viewTransitionFiles = { 'view-transition-section.ts': viewTransition, 'pages.ts': pages };

@tag('demo-router-page')
export class DemoRouterPage extends UIElement {
	protected override template() {
		return t`
			<code-preview .files=${fullFiles}><demo-router-full-section></demo-router-full-section></code-preview>
			<code-preview .files=${announcerFiles}><demo-router-announcer-section></demo-router-announcer-section></code-preview>
			<code-preview .files=${viewTransitionFiles}><demo-router-view-transition-section></demo-router-view-transition-section></code-preview>
		`;
	}
}
