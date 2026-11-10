/**
 * Executable demo for keyed list sorting — see map-by-key/README.md § Example and demo/README.md.
 * Run: npm test -- map-by-key-sort.example  (from src/std-ui)
 */
import { describe, expect, it } from 'vitest';
import { mapByKey } from '../template/directives/map-by-key/index.js';
import { t } from '../template/html.js';
import { state, tag, UIElement } from '../ui-element.js';

type Chore = { id: string; label: string };

describe('doc: mapByKey keeps row DOM when a @state() list is reordered', () => {
	it('checkbox and <li> stay tied to chore id after sort', async () => {
		@tag('sortable-chores')
		class SortableChores extends UIElement {
			@state() chores: Chore[] = [
				{ id: 'wash', label: 'Wash dishes' },
				{ id: 'mail', label: 'Check mail' },
				{ id: 'walk', label: 'Walk the dog' },
				{ id: 'read', label: 'Read a chapter' },
			];

			protected override template() {
				return t`
					<p>Chore list — sort and the rows move; keyed rows keep their controls.</p>
					<button type="button" data-action="az" @click="${() => this.sortByLabel(1)}">A → Z</button>
					<button type="button" data-action="za" @click="${() => this.sortByLabel(-1)}">Z → A</button>
					<ul>
						${mapByKey(
							this.chores.deep(),
							(c) => c.id,
							(c) => t`
								<li data-id="${c.id}">
									<label><input type="checkbox" /> ${c.id}) ${c.label}</label>
								</li>
							`,
						)}
					</ul>
				`;
			}

			private sortByLabel(dir: 1 | -1) {
				// New array reference so @state() notifies; in-place .sort() would not.
				this.chores.set([...this.chores.deep()].sort((a, b) => a.label.localeCompare(b.label) * dir));
			}
		}

		const el = document.createElement('sortable-chores') as SortableChores;
		document.body.appendChild(el);
		await el.updateComplete;

		const liWalk = el.querySelector('li[data-id="walk"]')!;
		const checkbox = liWalk.querySelector('input')! as HTMLInputElement;
		checkbox.checked = true;

		el.querySelector<HTMLButtonElement>('[data-action="az"]')!.click();
		await el.updateComplete;

		expect(Array.from(el.querySelectorAll('li')).map((li) => li.getAttribute('data-id'))).toEqual([
			'mail',
			'read',
			'walk',
			'wash',
		]);

		const liWalkAfter = el.querySelector('li[data-id="walk"]')!;
		expect(liWalkAfter).toBe(liWalk);
		expect(liWalkAfter.querySelector('input')).toBe(checkbox);
		expect(checkbox.checked).toBe(true);

		el.remove();
	});
});
