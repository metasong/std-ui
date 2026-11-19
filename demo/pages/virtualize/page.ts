// Body of the virtualize demo: each section wrapped in `<code-preview>`.
import { t, tag, UIElement } from '@std-ui/core';
import '../../shared/code-preview.js';
import vertical from './sections/vertical-section.ts?raw';
import headers from './sections/headers-section.ts?raw';
import grid from './sections/grid-section.ts?raw';
import horizontal from './sections/horizontal-section.ts?raw';

const verticalFiles = { 'vertical-section.ts': vertical };
const headersFiles = { 'headers-section.ts': headers };
const gridFiles = { 'grid-section.ts': grid };
const horizontalFiles = { 'horizontal-section.ts': horizontal };

@tag('demo-virtualize-page')
export class DemoVirtualizePage extends UIElement {
	protected override template() {
		return t`
			<code-preview .files=${verticalFiles}><demo-virtualize-vertical></demo-virtualize-vertical></code-preview>
			<code-preview .files=${headersFiles}><demo-virtualize-headers></demo-virtualize-headers></code-preview>
			<code-preview .files=${gridFiles}><demo-virtualize-grid></demo-virtualize-grid></code-preview>
			<code-preview .files=${horizontalFiles}><demo-virtualize-horizontal></demo-virtualize-horizontal></code-preview>
		`;
	}
}
