// Pulls several features together in one realistic component: `state()` with a plain-object
// value (tree-backed, per-leaf reactivity), list rendering, `computed`, and event handlers.
import { css, tag, t, UIElement, state } from '@std-ui/core';
import { computed } from '@std-ui/core';

interface Todo { id: number; text: string; done: boolean; }

let nextId = 1;

@tag('demo-todo-section')
export class DemoTodoSection extends UIElement {
	static override styles = css`
		.demo-todo-list {
			list-style: none;
			margin: 0;
			padding: 0;
		}

		.demo-todo-item {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.5rem 0;
			border-bottom: 1px solid var(--std-sys-color-outline-variant);
		}

		.demo-todo-item:last-child {
			border-bottom: none;
		}

		.demo-todo-item span.done {
			text-decoration: line-through;
			color: var(--std-sys-color-on-surface-variant);
		}

		.demo-todo-item button.tonal {
			padding: 0.35rem 0.65rem;
			min-width: 2.25rem;
		}

		.demo-todo-form {
			display: flex;
			gap: 0.75rem;
			margin-top: 1rem;
		}

		.demo-todo-form .demo-outlined-field {
			flex: 1;
		}
	`;

	readonly todos = state<Todo[]>([
		{ id: nextId++, text: 'Read the std-ui docs', done: true },
		{ id: nextId++, text: 'Build a demo app', done: false },
	]);

	protected override template() {
		const todos = this.todos();
		const remaining = computed(() => this.todos().filter(t => !t.done).length)();

		return t`
			<h2>Putting it together: a tiny todo list</h2>
			<p class="desc">A realistic composition of <code>state()</code>, list rendering, and event bindings — no framework, no virtual DOM.</p>
			<p>${remaining} remaining of ${todos.length}</p>
			<ul class="demo-todo-list">
				${todos.map(todo => t`
					<li class="demo-todo-item">
						<input type="checkbox" .checked=${todo.done} @change=${() => this.#toggle(todo.id)} />
						<span class=${todo.done ? 'done' : ''}>${todo.text}</span>
						<button type="button" class="tonal" style="margin-left:auto;" @click=${() => this.#remove(todo.id)}>✕</button>
					</li>
				`)}
			</ul>
			<form class="demo-todo-form" @submit=${(e: Event) => this.#onSubmit(e)}>
				<input class="demo-outlined-field" type="text" name="text" placeholder="new todo" />
				<button type="submit">add</button>
			</form>
		`;
	}

	#toggle(id: number): void {
		this.todos.set(this.todos().map(t => (t.id === id ? { ...t, done: !t.done } : t)));
	}

	#remove(id: number): void {
		this.todos.set(this.todos().filter(t => t.id !== id));
	}

	#onSubmit(e: Event): void {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const input = form.elements.namedItem('text') as HTMLInputElement;
		const text = input.value.trim();
		if (!text) return;
		this.todos.set([...this.todos(), { id: nextId++, text, done: false }]);
		form.reset();
	}
}
