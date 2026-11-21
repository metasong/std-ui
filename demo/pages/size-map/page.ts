import { t, tag, UIElement } from '@std-ui/core';
@tag('demo-size-map-page')
export class DemoSizeMapPage extends UIElement {
	protected override template() {
		return t`
			<demo-size-map-summary></demo-size-map-summary>
			<demo-size-map-treemap id="treemap"></demo-size-map-treemap>
		`;
	}
}