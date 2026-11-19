import { t, tag, UIElement } from '@std-ui/core';

@tag('demo-not-found')
export class DemoNotFound extends UIElement {
	protected override template() {
		return t`<h2>404</h2><p>No demo at this address. <a href="/tour">Go to the tour.</a></p>`;
	}
}
