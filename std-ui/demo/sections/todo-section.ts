// Pulls several features together in one realistic component: `@state()` with a plain-object
// value (tree-backed, per-leaf reactivity), list rendering, `computed`, and event handlers.
import { tag, t, UIElement, state } from '../../src/index.js';
import { computed } from '../../src/signal/index.js';

interface Todo { id: number; text: string; done: boolean; }

let nextId = 1;

@tag('demo-todo-section')
export class DemoTodoSection extends UIElement {
	@state() todos: Todo[] = [
		{ id: nextId++, text: 'Read the std-ui docs', done: true },
		{ id: nextId++, text: 'Build a demo app', done: false },
	];

	protected override template() {
		const remaining = computed(() => this.todos.filter(t => !t.done).length)();

		return t`
			<h2>Putting it together: a tiny todo list</h2>
			<p class="desc">A realistic composition of <code>@state()</code>, list rendering, and event bindings — no framework, no virtual DOM.</p>
			<p>${remaining} remaining of ${this.todos.length}</p>
			<ul class="demo-todo-list">
				${this.todos.map(todo => t`
					<li class="demo-todo-item">
						<input type="checkbox" .checked="${todo.done}" @change="${() => this.#toggle(todo.id)}" />
						<span class="${todo.done ? 'done' : ''}">${todo.text}</span>
						<button type="button" class="tonal" style="margin-left:auto;" @click="${() => this.#remove(todo.id)}">✕</button>
					</li>
				`)}
			</ul>
			<form class="demo-todo-form" @submit="${(e: Event) => this.#onSubmit(e)}">
				<input class="demo-outlined-field" type="text" name="text" placeholder="new todo" />
				<button type="submit">add</button>
			</form>
		`;
	}

	#toggle(id: number): void {
		this.todos = this.todos.map(t => (t.id === id ? { ...t, done: !t.done } : t));
	}

	#remove(id: number): void {
		this.todos = this.todos.filter(t => t.id !== id);
	}

	#onSubmit(e: Event): void {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const input = form.elements.namedItem('text') as HTMLInputElement;
		const text = input.value.trim();
		if (!text) return;
		this.todos = [...this.todos, { id: nextId++, text, done: false }];
		form.reset();
	}
}
