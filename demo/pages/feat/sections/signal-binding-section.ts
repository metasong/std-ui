// Signal bindings: a bare signal in a template slot (`${this.count}`) is followed by the slot itself, so a
// change patches that slot and `template()` is not re-run. Reading it (`${this.count.get()}`) makes the whole
// template depend on it and re-run. The run counter below is itself a bare signal, so showing it does not
// re-run the template (it would loop otherwise).
import { computed, raw, state, t, tag, UIElement } from '@std-ui/core';

@tag('demo-feat-signal-binding-bare')
export class DemoFeatSignalBindingBare extends UIElement {
	readonly count = state(0);
	readonly doubled = computed(() => this.count.get() * 2);
	// A field, not an inline computed() in template(): a new computed per run would be rebound each time.
	readonly odd = computed(() => this.count.get() % 2 === 1);
	readonly runs = state(0);

	protected override template() {
		// Written from a microtask through update() (which peeks), so the counter is never a dependency of this template.
		queueMicrotask(() => this.runs.update((n) => n + 1));
		return t`
			<div>
				<button type="button" @click=${() => this.count.update((n) => n + 1)}>count +1</button>
				<p>count: <b>${this.count}</b>, doubled: <b>${this.doubled}</b></p>
				<p>
					<progress max="20" .value=${this.count}></progress>
					<input type="checkbox" disabled ?checked=${this.odd} /> odd
				</p>
				<p>template() ran <b>${this.runs}</b> time(s)</p>
			</div>
		`;
	}
}

@tag('demo-feat-signal-binding-read')
export class DemoFeatSignalBindingRead extends UIElement {
	readonly count = state(0);
	readonly runs = state(0);

	protected override template() {
		queueMicrotask(() => this.runs.update((n) => n + 1));
		return t`
			<div>
				<button type="button" @click=${() => this.count.update((n) => n + 1)}>count +1</button>
				<p>count: <b>${this.count.get()}</b></p>
				<p>template() ran <b>${this.runs}</b> time(s)</p>
			</div>
		`;
	}
}

@tag('demo-feat-signal-binding-raw')
export class DemoFeatSignalBindingRaw extends UIElement {
	readonly count = state(3);

	protected override template() {
		// `.prop=${sig}` hands the element the value; `raw(sig)` hands it the signal itself.
		return t`
			<div>
				<button type="button" @click=${() => this.count.update((n) => n + 1)}>count +1</button>
				<demo-feat-signal-binding-probe .value=${this.count} .source=${raw(this.count)}></demo-feat-signal-binding-probe>
			</div>
		`;
	}
}

// A plain custom element with `value` / `source` setters, so the demo can show what a `.prop` binding delivers.
class DemoFeatSignalBindingProbe extends HTMLElement {
	#value: unknown;
	#source: { peek?: unknown } | undefined;
	set value(next: unknown) {
		this.#value = next;
		this.#show();
	}
	set source(next: { peek?: unknown } | undefined) {
		this.#source = next;
		this.#show();
	}
	#show() {
		this.textContent = `.value received: ${String(this.#value)}; .source received a signal: ${typeof this.#source?.peek === 'function'}`;
	}
}
if (!customElements.get('demo-feat-signal-binding-probe')) customElements.define('demo-feat-signal-binding-probe', DemoFeatSignalBindingProbe); // guard: hot reload re-runs this module

@tag('demo-feat-signal-binding-section')
export class DemoFeatSignalBindingSection extends UIElement {
	protected override template() {
		return t`
			<section id="signal-binding">
				<h2>Signal bindings</h2>
				<p class="desc">
					Bind a signal itself, not its value: put <code>this.count</code> in the slot. The slot (child, attribute,
					<code>?attr</code> or <code>.prop</code>) follows it and patches only itself, so <code>template()</code>
					runs once. Writing <code>this.count.get()</code> there reads it in the template and re-runs the whole thing.
					In a <code>.prop</code> binding, <code>raw(sig)</code> passes the signal object itself.
				</p>
				<h3>Bare signals</h3>
				<demo-feat-signal-binding-bare></demo-feat-signal-binding-bare>
				<h3>Read in the template</h3>
				<demo-feat-signal-binding-read></demo-feat-signal-binding-read>
				<h3><code>.prop</code> and <code>raw()</code></h3>
				<demo-feat-signal-binding-raw></demo-feat-signal-binding-raw>
			</section>
		`;
	}
}
