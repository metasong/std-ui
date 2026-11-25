// Demonstrates: `mapByKey` — keyed list reconciliation when the list store changes order.
import { css, tag, t, UIElement } from '@std-ui/core';
import { stateTree, mapByKey } from '@std-ui/ext';

type Chore = { id: string; label: string };

@tag('demo-map-by-key-section')
export class DemoMapByKeySection extends UIElement {
	static override styles = css`
		.demo-chore-list {
			list-style: none;
			margin: 0;
			padding: 0;
		}

		.demo-chore-item {
			padding: 0.5rem 0;
			border-bottom: 1px solid var(--std-sys-color-outline-variant);
		}

		.demo-chore-item:last-child {
			border-bottom: none;
		}

		.demo-chore-item label {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			cursor: pointer;
		}
	`;

	readonly chores = stateTree<Chore[]>([
		{ id: 'wash', label: 'Wash dishes' },
		{ id: 'mail', label: 'Check mail' },
		{ id: 'walk', label: 'Walk the dog' },
		{ id: 'read', label: 'Read a chapter' },
	]);

	protected override template() {
		const chores = this.chores.get();
		return t`
			<h2>Keyed lists (<code>mapByKey</code>)</h2>
			<p class="desc">
				Sort the chores, then check a box and sort again — the checkbox stays with the same chore because rows are keyed by <code>id</code>, not list index. The todo section above uses a plain <code>.map()</code> (positional).
			</p>
			<div class="demo-actions">
				<button type="button" @click=${() => this.sortByLabel(1)}>A → Z</button>
				<button type="button" class="tonal" @click=${() => this.sortByLabel(-1)}>Z → A</button>
			</div>
			<ul class="demo-chore-list">
				${mapByKey(
					chores,
					(c: Chore) => c.id,
					(c: Chore) => t`
						<li class="demo-chore-item" data-id=${c.id}>
							<label>
								<input type="checkbox" />
								<span>${c.id}) ${c.label}</span>
							</label>
						</li>
					`,
				)}
			</ul>
		`;
	}

	private sortByLabel(dir: 1 | -1): void {
		this.chores.set([...this.chores.get()].sort((a, b) => a.label.localeCompare(b.label) * dir));
	}
}
