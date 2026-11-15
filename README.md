# std-ui

### Build UI with the platform. Not around it.

**Signals. Tagged templates. Custom Elements.** No virtual DOM. No framework runtime. No lock-in.

std-ui is a tiny, standards-first UI toolkit: your components are real Web Components, your
reactivity is fine-grained signals, and your templates are plain tagged template literals.

---

## Built on web standards

- **Web Components**: every component is a native Custom Element.
- **String templates**: tagged template literals, not JSX or a template compiler.
- **Signals**: reactive state that drives the UI directly.
- **Decorators**: standard decorators (`@attribute`, `@provide`, `@consume`) to declare component metadata.

## No compiler. No framework runtime.

There is no build step to adopt it. Load it as a plain `<script>` in the browser and start building.

```html
<script src="std-ui.iife.min.js"></script>
<script>
	// build your app right here
</script>
```

## No virtual DOM. No change-detection loop.

There is no tree diffing and no dirty-checking cycle. Signal state drives **fine-grained UI updates**: when a signal changes, only the exact DOM nodes that read it are updated.

## Fully extensible

The core is small on purpose, and almost everything else is an add-on built on the same public extension points you can use:

- **UIElement hooks** (`registerUIElementHooks`): plug into the component lifecycle.
- **Class registries** (`createClassRegistry`) and **metadata** (`ownMetadata`): build your own decorators.
- **State tree extensions** (`extendTree`, `.with(...)`): add features such as change tracking to every node in a state tree.

`std-ui-ext` is the proof. Context, change tracking and forms are built only on these public APIs, and `std-ui` has no knowledge of them. You can write yours the same way.

## Why std-ui?

- **Tiny.** The full core ships at about **17 kB gzip** (`std-ui.iife.min.js`), and the add-ons at about **3 kB**.
- **Fine-grained reactivity.** `signal`, `computed` and `effect` update exactly the DOM that changed. There is no diffing and no re-render of whole trees.
- **Real Web Components.** Extend `UIElement`, and it works anywhere HTML works.
- **Reactive state trees.** Wrap plain objects and arrays in `state(...)` to get deeply reactive, typed stores.
- **Type-safe by design.** Fields are the store itself (`SignalState<number>`), so there are no decorator type lies and IntelliSense just works.
- **Fully extensible.** Hooks, registries and tree extensions let you add your own features.
- **Opt-in extras.** Context, change tracking and forms live in `std-ui-ext`. The core knows nothing about them, so you pay only for what you import.

## A taste

```ts
import { UIElement, tag, attribute, state, t, css } from 'std-ui';
import { provide, consume, createContextKey } from 'std-ui-ext';

interface Theme { mode: 'light' | 'dark'; }
const ThemeKey = createContextKey<Theme>('theme');

@tag('app-root')
class AppRoot extends UIElement {
	@provide(ThemeKey) readonly theme = state<Theme>({ mode: 'dark' }); // shared with every descendant
	static override shadowRootOptions = { mode: 'open' } as const; // render into a shadow root so <slot> projects children
	protected override template() { return t`<slot></slot>`; }
}

@tag('counter-button')
class CounterButton extends UIElement {
	static override styles = css`button { padding: .5rem 1rem; } button.dark { background: #222; color: #fff; }`;
	@attribute({ type: Number, reflect: true }) readonly count = state(0); // <counter-button count="3">
	@consume(ThemeKey) readonly theme!: Theme;                            // nearest ancestor's value

	protected override template() {
		return t`<button class=${this.theme.mode} @click=${() => this.count.set(this.count() + 1)}>
			Clicked ${this.count()} times
		</button>`;
	}
}
```

```html
<app-root><counter-button count="3"></counter-button></app-root>
```

`@tag` names the element, `@attribute` mirrors a store to an HTML attribute, and `@provide` / `@consume` pass state down the tree. Prefer no build step? Every decorator has a decorator-free equivalent (`defineElement`, `defineContext`).

> **Note:** decorators are optional. You can also create apps without decorators, using plain classes and `defineElement`, so nothing needs a compiler.

```ts
class CounterButton extends UIElement {
	readonly count = state(0);
	protected override template() {
		return t`<button @click=${() => this.count.set(this.count() + 1)}>Clicked ${this.count()} times</button>`;
	}
}
defineElement('counter-button', CounterButton, {
	attributes: { count: { type: Number, reflect: true } },
});
```

## Validate state, reactively

A form-associated element in a few lines: validation feeds the native constraint API (`checkValidity()`, `:invalid`, blocking form submit).

```ts
import { tag, state, t } from 'std-ui';
import { FormElement, check, required, minLength, asyncValidator, flags } from 'std-ui-ext';

@tag('name-input')
class NameInput extends FormElement {
	// reusable validators on a reactive state node
	readonly name = state('').with(check);

	constructor() {
		super();
		// async check, e.g. a server round trip: debounced, and cancelled when the value changes
		const unique = asyncValidator<string>(
			async (name, { abortSignal }) => {
				const res = await fetch(`/api/name-taken?n=${encodeURIComponent(name)}`, { abortSignal });
				return (await res.json()).taken ? { flag: flags.customError, message: 'Name taken' } : null;
			},
			{ debounce: 300 },
		);
		this.name.check.validators.set([required('Name is required'), minLength(2), unique]);
	}

	protected override template() {
		return t`<input placeholder="Name" @input=${(e: Event) => {
			const value = (e.target as HTMLInputElement).value;
			this.name.set(value);
			this.setValue(value); // sets the form value and re-runs validate()
		}} />`;
	}
}
```

```html
<form><name-input name="name"></name-input><button>Save</button></form>
```

Validators are plain functions, so writing your own is one line. Built-ins use the standard `ValidityState` flags, and async validators track a `pending` state, so `this.name.check.pending()` can gate submit while a check is in flight.

## Track changes in one line

```ts
import { state, effect } from 'std-ui';
import { changes } from 'std-ui-ext';

const form = state({ name: '', tags: [] as string[] }).with(changes);

effect(() => {
	// re-runs whenever the form's dirty state changes
	saveButton.disabled = !form.changes.dirty();
});

form.name.set('Ada');        // effect runs: dirty() is true, Save is enabled
form.changes.reset();        // back to the initial value: dirty() is false, Save is disabled
```

Every node in the tree, including members added later, gets `dirty`, `initial` and `reset`.

## What's inside

| Package | What you get |
|---|---|
| [`std-ui`](./std-ui/README.md) | Signals, reactive state trees, HTML/CSS templates, `classMap` / `styleMap` directives, `UIElement`, `@attribute`, `defineElement` |
| [`std-ui-ext`](./std-ui-ext/README.md) | Context (`@provide` / `@consume`), change tracking, form helpers, built only on std-ui's public extension points |

## Bundle size

| File | Minified | Gzip | Brotli |
|---|---|---|---|
| `std-ui.iife.min.js` | 48.35 kB | 16.69 kB | 15.10 kB |
| `std-ui-ext.iife.min.js` | 8.10 kB | 3.18 kB | 2.83 kB |

## Get started

```bash
npm install
npm run demo        # live browser demo (Vite)
npm test            # Vitest suite
npm run build       # npm packages and minified browser bundles
```

Dive deeper in the [std-ui guide](./std-ui/README.md) and the [std-ui-ext add-ons](./std-ui-ext/README.md).

---

**std-ui: less framework, more web.**



