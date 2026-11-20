// Page body of the feature demo: each section wrapped in `<code-preview>` with its own source as the tab.
import { t, tag, UIElement } from '@std-ui/core';
import '../../shared/code-preview.js';
import counter from './sections/counter-section.ts?raw';
import attribute from './sections/attribute-section.ts?raw';
import context from './sections/context-section.ts?raw';
import query from './sections/query-section.ts?raw';
import shadow from './sections/shadow-section.ts?raw';
import css from './sections/css-section.ts?raw';
import directives from './sections/directives-section.ts?raw';
import bindings from './sections/bindings-section.ts?raw';
import eventExtensions from './sections/event-extensions-section.ts?raw';
import todo from './sections/todo-section.ts?raw';
import mapByKey from './sections/map-by-key-section.ts?raw';
import svgSection from './sections/svg-section.ts?raw';
import mathmlSection from './sections/mathml-section.ts?raw';

const files = (name: string, source: string) => ({ [name]: source });

@tag('demo-feature-page')
export class DemoFeaturePage extends UIElement {
	protected override template() {
		return t`
			<code-preview id="counter" .files=${files('counter-section.ts', counter)}>
				<demo-counter-section></demo-counter-section>
			</code-preview>
			<code-preview id="attribute" .files=${files('attribute-section.ts', attribute)}>
				<demo-attribute-section theme="light" count="3"></demo-attribute-section>
			</code-preview>
			<code-preview id="context" .files=${files('context-section.ts', context)}>
				<demo-context-section></demo-context-section>
			</code-preview>
			<code-preview id="query" .files=${files('query-section.ts', query)}>
				<demo-query-section></demo-query-section>
			</code-preview>
			<code-preview id="shadow" .files=${files('shadow-section.ts', shadow)}>
				<demo-shadow-section></demo-shadow-section>
			</code-preview>
			<code-preview id="css" .files=${files('css-section.ts', css)}>
				<demo-css-section></demo-css-section>
			</code-preview>
			<code-preview id="directives" .files=${files('directives-section.ts', directives)}>
				<demo-directives-section></demo-directives-section>
			</code-preview>
			<code-preview id="bindings" .files=${files('bindings-section.ts', bindings)}>
				<demo-bindings-section></demo-bindings-section>
			</code-preview>
			<code-preview id="event-extensions" .files=${files('event-extensions-section.ts', eventExtensions)}>
				<demo-event-extensions-section></demo-event-extensions-section>
			</code-preview>
			<code-preview id="todo" .files=${files('todo-section.ts', todo)}>
				<demo-todo-section></demo-todo-section>
			</code-preview>
			<code-preview id="map-by-key" .files=${files('map-by-key-section.ts', mapByKey)}>
				<demo-map-by-key-section></demo-map-by-key-section>
			</code-preview>
			<code-preview id="svg" .files=${files('svg-section.ts', svgSection)}>
				<demo-svg-section></demo-svg-section>
			</code-preview>
			<code-preview id="mathml" .files=${files('mathml-section.ts', mathmlSection)}>
				<demo-mathml-section></demo-mathml-section>
			</code-preview>
		`;
	}
}
