import { t, tag, UIElement } from '@std-ui/core';
import { browserBundleTree } from '../bundle-tree.js';
import { SIZE_DATA } from '../data.js';
import '../treemap-map.js';

@tag('demo-size-map-summary')
export class DemoSizeMapSummary extends UIElement {
	readonly #bundleTree = browserBundleTree(SIZE_DATA.bundles);

	protected override template() {
		const generated = new Date(SIZE_DATA.generatedAt);
		const stamp = Number.isNaN(generated.getTime())
			? SIZE_DATA.generatedAt
			: generated.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
		return t`
			<h2 id="bundles">Browser bundles</h2>
			<p class="desc">
				Block area = Brotli size. Hover a tile for full filename and bytes. Data in
				<code>bundle-sizes.json</code> — <code>npm run build</code> then <code>node scripts/size-map.mjs</code>.
				Updated ${stamp}.
			</p>
			<demo-treemap-map .tree=${this.#bundleTree} .aspect=${2.6} .showLeafKb=${true} .showFolderKb=${false} .unit=${'brotli'} .keepGroupOrder=${true}></demo-treemap-map>
		`;
	}
}