import { css, t, tag, UIElement } from '@std-ui/core';
import { SIZE_DATA } from '../data.js';
import '../treemap-map.js';

@tag('demo-size-map-treemap')
export class DemoSizeMapTreemap extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	static override styles = css`
		:host { display: block; margin-block: 0 2rem; }
		h2 {
			margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 500; letter-spacing: 0.01em;
			color: var(--md-sys-color-on-surface, #1d1b20);
		}
		p.desc {
			margin: 0 0 1rem; font-size: 0.875rem; line-height: 1.45;
			color: var(--md-sys-color-on-surface-variant, #49454f);
		}
		p.desc code {
			font-family: 'Roboto Mono', ui-monospace, monospace; font-size: 0.85em;
			background: var(--md-sys-color-surface-container-high, #ece6f0);
			padding: 0.1rem 0.35rem; border-radius: 4px;
		}
		.panels { display: grid; gap: 1.25rem; }
	`;

	protected override template() {
		return t`
			<h2 id="treemap">ESM size map (gzip)</h2>
			<p class="desc">
				Nested blocks mirror <code>dist/esm</code> folders down to each <code>.js</code> file. Parent boxes
				contain children; area is gzip bytes (level 9), like a bundle analyzer treemap.
			</p>
			<div class="panels">
				${SIZE_DATA.packages.map((tree) => t`
					<div class="panel">
						<demo-treemap-map
							.tree=${tree}
							.aspect=${2.1}
							.showLeafKb=${true}
							.showRoot=${true}
						></demo-treemap-map>
					</div>
				`)}
			</div>
		`;
	}
}