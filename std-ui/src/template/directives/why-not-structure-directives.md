# Why not `if`, `for`, or `switch` directives?

Some template libraries ship **structure directives** — helpers that decide *what* markup exists
(`if` / `when`, `repeat` / `for`, `choose` / `switch`). std-ui does **not** add built-ins for those
shapes. Composition stays ordinary JavaScript inside `` t`...` ``, plus the small directive set in
this folder (`classMap`, `styleMap`, `mapByKey`, `html`, `bind`, `virtualize`, …).

That is intentional: conditionals and iteration are already first-class in TypeScript, they stay
readable in templates, and you avoid learning a parallel “template control flow” API. When you need
keyed list reconciliation, use **`mapByKey`**; otherwise **`Array#map`** (or any iterable you build)
is enough.

For how child bindings treat `null` / `false` / `undefined`, nested `` t`...` ``, and list diffing, see
[`../html.md`](../html.md#logic-conditionals-and-lists).

## `if` / `else`

**Why not:** A dedicated `if` directive would mostly wrap a ternary or an `if` in `template()`. The
engine already treats falsy child values as empty, and boolean attributes use `?attr`. No extra
protocol is needed for the common cases.

**Use instead** — one `template()` return; branches are nested `` t`...` `` literals in `${...}`:

```ts
import { tag, t, UIElement, state } from 'std-ui';

@tag('demo-greeting')
class DemoGreeting extends UIElement {
  @state() loggedIn = false;
  @state() name = 'Ada';

  protected override template() {
    return t`
      <section>
        ${this.loggedIn ? t`<p>Welcome, ${this.name}</p>` : null}
        ${this.loggedIn
          ? t`<p class="ok">You are signed in.</p>`
          : t`<p class="hint">Please sign in.</p>`}
        <p ?hidden="${!this.loggedIn}">Account settings and extra details live here.</p>
      </section>
    `;
  }
}
```

**If / else if / else** — chain `? :` with each condition on its own line; align `?` and `:` so
nesting reads like `if` / `else if` / `else`:

```ts
import { tag, t, UIElement, state } from 'std-ui';

type Role = 'admin' | 'member' | 'guest';

@tag('demo-role-banner')
class DemoRoleBanner extends UIElement {
  @state() role: Role = 'guest';

  protected override template() {
    return t`
      <section class="role-banner">
        ${this.role === 'admin'
          ? t`<p class="banner admin">Full admin console</p>`
          : this.role === 'member'
            ? t`<p class="banner member">Member dashboard</p>`
            : t`<p class="banner guest">Sign up to get access</p>`}
      </section>
    `;
  }
}
```

Prefer conditional *values* in the same outer `` t`...` `` when you care about in-place updates
(e.g. `?hidden`); use nested templates in `${...}` when the markup shape per branch should change.

## `for` (lists / repetition)

**Why not:** Lists are just child content: map an array to template results, or pass an array
directly. A `for` directive would duplicate `Array#map` with worse ergonomics in TypeScript. The
only list problem std-ui solves separately is **identity**: positional children vs keyed reconcile.

**Use instead** — row markup stays inline in the main template; only `.map` / `mapByKey` callbacks
wrap each row’s `` t`...` ``:

```ts
import { tag, t, UIElement, state, mapByKey } from 'std-ui';

type Todo = { id: number; text: string; done: boolean };

@tag('demo-todo-list')
class DemoTodoList extends UIElement {
  @state() todos: Todo[] = [
    { id: 1, text: 'Learn std-ui', done: true },
    { id: 2, text: 'Ship a feature', done: false },
  ];

  protected override template() {
    // Fixed order, append/remove at the end — positional list diff is enough
    return t`
      <ul class="positional">
        ${this.todos.map((todo) => t`
          <li>
            <input type="checkbox" .checked="${todo.done}" />
            ${todo.text}
          </li>
        `)}
      </ul>
    `;
  }
}

@tag('demo-sortable-todos')
class DemoSortableTodos extends UIElement {
  @state() todos: Todo[] = [
    { id: 1, text: 'Alpha', done: false },
    { id: 2, text: 'Beta', done: false },
  ];

  protected override template() {
    // Reorder or splice — keyed rows keep controls on the right item
    return t`
      <ul class="keyed">
        ${mapByKey(
          this.todos,
          (todo) => todo.id,
          (todo) => t`
            <li data-id="${todo.id}">
              <input type="checkbox" .checked="${todo.done}" />
              ${todo.text}
            </li>
          `,
        )}
      </ul>
    `;
  }
}
```

See [`map-by-key/README.md`](./map-by-key/README.md) for when index-based lists mis-attach DOM/state
after sort or splice.

## `switch` (multi-way choice)

**Why not:** Multi-branch UI state is a `switch` in application code, a lookup table, or a small
ternary chain in `${...}`. A `choose` directive would not add reconciliation benefits; it would only
hide standard TypeScript control flow.

**Use instead** — express every case inside the main `` t`...` `` (nested ternaries or inline
`` t`...` `` per case):

```ts
import { tag, t, UIElement, state } from 'std-ui';

type LoadState = 'idle' | 'loading' | 'error';
type Tab = 'home' | 'settings';

@tag('demo-status-panel')
class DemoStatusPanel extends UIElement {
  @state() loadState: LoadState = 'idle';
  @state() errorMessage = '';

  protected override template() {
    return t`
      <header>
        ${this.loadState === 'loading'
          ? t`<p class="loading">Working…</p>`
          : this.loadState === 'error'
            ? t`<p class="err">${this.errorMessage}</p>`
            : null}
      </header>
    `;
  }
}

@tag('demo-tabs')
class DemoTabs extends UIElement {
  @state() tab: Tab = 'home';
  @state() size: 's' | 'm' | 'l' = 'm';

  protected override template() {
    return t`
      <nav>
        <button type="button" ?aria-current="${this.tab === 'home'}" @click="${() => { this.tab = 'home'; }}">Home</button>
        <button type="button" ?aria-current="${this.tab === 'settings'}" @click="${() => { this.tab = 'settings'; }}">Settings</button>
      </nav>
      <main>
        ${this.tab === 'home'
          ? t`<section><h2>Home</h2></section>`
          : t`<section><h2>Settings</h2></section>`}
      </main>
      <span>${this.size === 's' ? 'Small' : this.size === 'm' ? 'Medium' : 'Large'}</span>
    `;
  }
}
```

When each case is a different inner `` t`...` `` literal, changing `tab` or `loadState` swaps the
mounted subtree (same rules as `if` / `else` above).

## What we add instead of structure directives

| Concern | Built-in | Plain JS alternative |
|---|---|---|
| Conditional children | — | `? :`, `?hidden`, falsy child values |
| List rendering | — (positional) | `items.map(() => t\`...\`)` |
| Stable list rows | `mapByKey` | — |
| Class / style objects | `classMap`, `styleMap` | manual strings (worse updates) |
| Trusted HTML fragment | `html` | — |
| Two-way form binding | `bind` | manual listeners + properties |

If you need custom control flow with state across renders, implement a **child directive** via
[`../directive.ts`](../directive.ts) and [`../html.md`](../html.md#directives) — not a fork of `if`
/ `for` syntax inside the template literal.
