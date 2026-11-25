// Computed early return: leaf -> mid (parity) -> parent (label) -> effect. When `mid` recomputes to the
// same value, its version does not bump, so `parent` and the effect are skipped.
import { computed, state, t, tag, UIElement } from '@std-ui/core';

@tag('demo-feat-computed-skip')
export class DemoFeatComputedSkip extends UIElement {
	readonly leaf = state(1);
	// Run counters are plain state written from outside the graph; peek() so they are never tracked.
	readonly runs = state({ mid: 0, parent: 0, effect: 0 });

	readonly #bump = (k: 'mid' | 'parent' | 'effect') =>
		queueMicrotask(() => this.runs.update((r) => ({ ...r, [k]: r[k] + 1 })));

	readonly mid = computed(() => {
		this.#bump('mid');
		return this.leaf.get() % 2;
	});
	readonly parent = computed(() => {
		this.#bump('parent');
		return this.mid.get() === 0 ? 'even' : 'odd';
	});

	protected override connect() {
		this.effect(() => {
			this.parent.get();
			this.#bump('effect');
		});
	}

	protected override template() {
		const r = this.runs.get();
		return t`
			<div>
				<button type="button" @click=${() => this.leaf.update((n) => n + 1)}>leaf +1 (parity flips)</button>
				<button type="button" @click=${() => this.leaf.update((n) => n + 2)}>leaf +2 (parity same)</button>
				<p>leaf: <b>${this.leaf.get()}</b> &rarr; parent: <b>${this.parent.get()}</b></p>
				<p>mid ran <b>${r.mid}</b>, parent ran <b>${r.parent}</b>, effect ran <b>${r.effect}</b></p>
			</div>
		`;
	}
}

@tag('demo-feat-computed-skip-section')
export class DemoFeatComputedSkipSection extends UIElement {
	protected override template() {
		return t`
			<section id="computed-skip">
				<h2>Computed early return</h2>
				<p class="desc">
					<code>+2</code> changes the leaf but <code>mid</code> returns the same parity: only <code>mid</code> reruns;
					<code>parent</code> and the effect are skipped. <code>+1</code> flips it, so all three run.
				</p>
				<demo-feat-computed-skip></demo-feat-computed-skip>
			</section>
		`;
	}
}
