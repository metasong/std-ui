// Demonstrates: the `svg` tag — embedding SVG *fragments* (no `<svg>` ancestor in the template string).
import { tag, t, svg, state, UIElement } from '@std-ui/core';

const xs = [40, 120, 200];

// Plain `t`: `<circle>` is parsed as HTML -> HTMLUnknownElement, never drawn.
const plainCircle = (x: number) => t`<circle r="20" cx="${x}" cy="40" fill="tomato"></circle>`;
// `svg`: parsed in the SVG namespace -> SVGCircleElement, drawn.
const svgCircle = (x: number) => svg`<circle r="20" cx="${x}" cy="40" fill="seagreen"></circle>`;

@tag('demo-svg-section')
export class DemoSvgSection extends UIElement {
	readonly report = state('');

	protected override template() {
		return t`
			<h2>SVG fragments (<code>svg</code>)</h2>
			<p class="desc">
				The HTML parser only creates SVG elements inside an <code>&lt;svg&gt;</code>. A fragment such as
				<code>&lt;circle&gt;</code> written with <code>t</code> has no <code>&lt;svg&gt;</code> ancestor in its own
				string, so it becomes an <code>HTMLUnknownElement</code> and nothing is drawn - even when it is later
				placed inside a real <code>&lt;svg&gt;</code>. Use <code>svg</code> for fragments that will be embedded into an
				existing <code>&lt;svg&gt;</code>. A complete <code>&lt;svg&gt;...&lt;/svg&gt;</code> works with plain <code>t</code>.
			</p>
			<div class="demo-actions">
				<div style="background:#fce8e6;border:1px solid #ea4335;border-radius:12px;padding:0.5rem 1rem">
					<p style="color:#c5221f;font-weight:500">&#10008; <code>t</code> fragment - not drawn</p>
					<svg id="svg-plain" width="240" height="80" style="border:1px solid #888">${xs.map(plainCircle)}</svg>
				</div>
				<div style="background:#e6f4ea;border:1px solid #34a853;border-radius:12px;padding:0.5rem 1rem">
					<p style="color:#137333;font-weight:500">&#10004; <code>svg</code> fragment - drawn</p>
					<svg id="svg-tag" width="240" height="80" style="border:1px solid #888">${xs.map(svgCircle)}</svg>
				</div>
			</div>
			<pre style="white-space:pre-wrap;font-size:0.8rem">${this.report()}</pre>
		`;
	}

	protected override firstRendered(): void {
		// Layout sizes are only available once the browser has laid out the rendered SVG.
		requestAnimationFrame(() => this.report.set(this.describe()));
	}

	private describe(): string {
		const lines = (id: string) =>
			[...this.querySelectorAll(`#${id} circle`)].map((c) => {
				const r = c.getBoundingClientRect();
				return `  ${c.constructor.name} ns=${c.namespaceURI} size=${r.width}x${r.height}`;
			});
		return `t:\n${lines('svg-plain').join('\n')}\n\nsvg:\n${lines('svg-tag').join('\n')}`;
	}
}
