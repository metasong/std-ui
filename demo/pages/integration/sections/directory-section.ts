// Integration: a people directory combining several features at once.
//   - `state` + validators      → the "add person" form model
//   - `bind()` / `formBind()`   → two-way search box; form fields with validation + touched mirrored onto the inputs
//   - `virtualize()`                  → the (filtered) list stays windowed however many people exist
//   - `state` + `UIElement`/`t` → the list itself and re-rendering
import { bind, t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import { check, formBind, formUi, virtualize } from '@std-ui/ext';
import { virtualizeListStyles } from '../../../shared/virtualize-list-styles.js';

type Person = { id: number; name: string; age: number };

const NAMES = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Edsger', 'Radia'];
const seed = (): Person[] =>
	Array.from({ length: 5_000 }, (_, id) => ({ id, name: `${NAMES[id % NAMES.length]} #${id}`, age: 18 + (id % 60) }));

const draft = stateTree({ name: '', age: 30 }).with(check).with(formUi);
draft.name.check.validators.set([
	v => (v ? undefined : { flag: 'valueMissing' as const, message: 'Name is required' }),
	v => (String(v).length >= 3 ? undefined : { flag: 'tooShort' as const, message: 'At least 3 characters' }),
]);
draft.age.check.validators.set([
	v => (v >= 18 && v <= 120 ? undefined : { flag: 'rangeOverflow' as const, message: 'Age must be 18–120' }),
]);

@tag('demo-integration-directory')
export class DemoIntegrationDirectory extends UIElement {
	static override styles = virtualizeListStyles;

	readonly people = stateTree<Person[]>(seed());
	readonly search = stateTree('');
	#nextId = 5_000;

	#visible(): Person[] {
		const q = this.search().trim().toLowerCase();
		const all = this.people();
		return q ? all.filter(p => p.name.toLowerCase().includes(q)) : all;
	}

	#add(): void {
		draft.formUi.touchAll();
		if (!draft.check.valid()) {
			this.querySelector<HTMLFormElement>('form')?.reportValidity();
			return;
		}
		const person: Person = { id: this.#nextId++, name: draft.name(), age: Number(draft.age()) };
		this.people.update(list => [person, ...list]);
		draft.name.set('');
		draft.formUi.untouchAll();
	}

	protected override template() {
		const visible = this.#visible();
		return t`
			<section class="demo-bind-block" id="directory">
				<h2>People directory</h2>
				<p class="desc">
					<code>bind()</code> drives the search box, <code>formBind()</code> the form: validators on the model
					are mirrored onto the inputs and <code>formUi</code> tracks touched, and <code>virtualize()</code> keeps the list small however many people match.
				</p>

				<label class="demo-bind-field">
					Search
					<input type="search" placeholder="filter by name" .value=${bind(this.search)} />
				</label>
				<p class="demo-bind-mirror">Showing <code>${visible.length}</code> of <code>${this.people().length}</code></p>

				<div class="demo-v-scroller demo-v-scroller-y">
					<div>
						${virtualize(visible, {
							itemSize: 36,
							gap: 0,
							overscan: 4,
							keyFn: (p: Person) => p.id,
							renderItem: (p: Person) => t`
								<div class="demo-v-row ${p.id % 2 === 0 ? 'demo-v-row-even' : ''}" style="height: 36px; box-sizing: border-box">
									<span>${p.name} · ${p.age}</span>
								</div>
							`,
						})}
					</div>
				</div>

				<h3>Add a person</h3>
				<form @submit=${(e: Event) => { e.preventDefault(); this.#add(); }}>
					<label class="demo-bind-field">
						Name
						<input type="text" .value=${formBind(draft.name)} />
					</label>
					<label class="demo-bind-field">
						Age
						<input type="number" .value=${formBind(draft.age)} />
					</label>
					<div class="demo-actions">
						<button type="submit">Add</button>
					</div>
				</form>
			</section>
		`;
	}
}
