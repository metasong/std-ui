# `bind()` — two-way property directive

Built-in **property directive** for `.name="${bind(...)}"` bindings. Combines:

1. **Model → view** with **live** semantics (skip writing when the element already shows the model).
2. **View → model** via a DOM event listener (no separate `@input` / `@change` in the template).

Roughly “Angular two-way on one property,” with Lit-style `live` on the down direction only.

```ts
import { t, bind, signalState, tag, UIElement } from 'std-ui';

@tag('search-field')
class SearchField extends UIElement {
	query = signalState('');

	protected override template() {
		return t`
			<input .value="${bind(this.query)}" placeholder="Search…" />
			<p>You typed: ${this.query()}</p>
		`;
	}
}
```

Design notes: [`design.md`](./design.md).

## API

### `bind(signal[, options])`

Binds a `signal()` or `signalState()` node directly — the model is the signal itself, no key strings. Any callable with a `.set()` works. The read happens during render, so model changes re-render the template.

```ts
const form = signalState({ query: '', agreed: false });

t`<input .value="${bind(form.query)}" />`
t`<input type="checkbox" .checked="${bind(form.agreed)}" />`
```

Override just the event (property on the element is still `.level` → default would be `level-change`):

```ts
const level = signalState(0);

t`<legacy-dial .level="${bind(level, { event: 'levelinput' })}" />`
```

Pass `read` / `write` / `equals` in the same options object:

```ts
t`
	<my-date
		.iso="${bind(dateIso, {
			event: 'date-change',
			read: (el, _prop) => (el as MyDate).iso,
			write: (el, _prop, v) => {
				(el as MyDate).iso = String(v ?? '');
			},
		})}"
	></my-date>
`
```

### `bind({ get, set, ...options })`

Escape hatch when the model is not a signal (computed value, external store, coercion):

```ts
t`
	<input
		type="number"
		.value="${bind({
			get: () => String(store.count()),
			set: (v) => store.count.set(Number(v)),
		})}"
	/>
`
```

Same shape with extra hooks in one object:

```ts
t`
	<my-editor
		.revision="${bind({
			get: () => this.revision,
			set: (v) => {
				this.revision = v as number;
			},
			event: 'revision-change',
			equals: (a, b) => a === b,
			read: (el) => (el as MyEditor).revision,
			write: (el, _prop, v) => {
				(el as MyEditor).revision = Number(v);
			},
		})}"
	></my-editor>
`
```

### `BindOptions`

| Option | Role |
|--------|------|
| `event` | Override the DOM event used for view → model. |
| `equals` | `(committed, live) => boolean` before writing to the element. |
| `read` | `(element, property) => unknown` — live value from the DOM/node. |
| `write` | `(element, property, committed) => void` — push model to the element. |

`read` / `write` are also the converter pair: `read` may return model-typed values (e.g. `el => Number(el.value)`), and `write` converts the model back for the element. On native `.value` controls, a numeric model is kept numeric automatically.

Do **not** bind `@input` / `@change` on the same property when using `bind()` — the directive installs its own listener.

## Default events

Resolved from the **property name** on the bound element (`PropertyPart.name`):

| Binding | Element | Default event |
|---------|-----------|---------------|
| `.checked` | checkbox / radio `<input>` | `change` |
| `.checked` | anything else | `checked-change` |
| `.value` | `<input>`, `<textarea>` | `input` |
| `.value` | `<select>` | `change` |
| `.value` | other (e.g. custom element) | `value-change` |
| `.anythingElse` | any | `anything-else-change` (kebab-case) |

`.checked` on a non-checkable `<input>` (e.g. `type="text"`) **throws** at directive construction time.

## Custom elements

Parent:

```ts
t`<my-editor .document="${bind(doc)}"></my-editor>`;
```

Child contract (default event `document-change`):

```ts
set document(v: Doc) {
	this._document = v;
	this.render();
}
#userEdited(next: Doc) {
	this._document = next;
	this.dispatchEvent(new Event('document-change', { bubbles: true }));
}
```

Override the event when your component uses a different name: `bind(doc, { event: 'doc-updated' })`.

## Compared to manual two-way

| | Manual | `bind()` |
|---|--------|----------|
| Down | `.value="${state}"` | live compare before assign |
| Up | `@input="${...}"` | single listener from `event` |
| Re-render while typing | may re-assign every keystroke | skips when DOM already matches |

## Browser demo

From `src/std-ui`: `npm run demo` → [bind demo](../../../../demo/bind.html) (see [`../../../../demo/README.md`](../../../../demo/README.md)).

## Related reading

- [`design.md`](./design.md) — `PropertyPart` dispatch, lifecycle, event defaults.
- [`bind.test.ts`](./bind.test.ts) — behavior tests.
- [`../../html.md`](../../html.md) — `.` property bindings.
- [`../directive.ts`](../directive.ts) — `PropertyPartInfo`, directive protocol.
