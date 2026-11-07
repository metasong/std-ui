// Pulls several features together in one realistic component: `@state()` with a plain-object
// value (tree-backed, per-leaf reactivity), list rendering, `computed`, and event handlers.
import { tag, html, UIElement, state } from '../../src/index.js';
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

		return html`
			<h2>Putting it together: a tiny todo list</h2>
			<p class="desc">A realistic composition of <code>@state()</code>, list rendering, and event bindings — no framework, no virtual DOM.</p>
			<p>${remaining} remaining of ${this.todos.length}</p>
			<ul style="list-style:none;padding:0;">
				${this.todos.map(todo => html`
					<li style="display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0;">
						<input type="checkbox" .checked="${todo.done}" @change="${() => this.#toggle(todo.id)}" />
						<span style="${todo.done ? 'text-decoration:line-through;color:#9ca3af;' : ''}">${todo.text}</span>
						<button type="button" @click="${() => this.#remove(todo.id)}" style="margin-left:auto;">✕</button>
					</li>
				`)}
			</ul>
			<form @submit="${(e: Event) => this.#onSubmit(e)}" style="display:flex;gap:0.5rem;">
				<input type="text" name="text" placeholder="new todo" style="flex:1;" />
				<button class="primary" type="submit">add</button>
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
