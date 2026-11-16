# `css.ts` / `static styles` — usage and design

A tiny `css` tagged template: write
stylesheets as `css...` literals instead of strings, so they're cacheable, composable, and -
via `UIElement`'s `static styles` - applied as real `CSSStyleSheet`s (shared across instances)
rather than re-parsed from a `<style>` tag embedded in `template()` on every render.

```ts
import { css, tag, UIElement } from '../../index.js';

const buttonStyles = css`
	:host { display: inline-block; }
	button { color: var(--accent, blue); }
`;

@tag('themed-button')
class ThemedButton extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;
	static override styles = buttonStyles; // or an array: [sharedStyles, buttonStyles]
}
```

## `css` / `CSSResult` / `unsafeCSS`

- `css` tags a literal, returning a `CSSResult` — a thin wrapper around the resolved `cssText`,
  with a `styleSheet` getter that lazily constructs (once) and caches a `CSSStyleSheet` via
  `replaceSync`.
- Interpolated values must themselves be `CSSResult`s (nested `css`/`unsafeCSS`) or plain numbers —
  arbitrary strings are rejected (`TypeError`) to avoid accidentally splicing untrusted/dynamic text
  into a stylesheet:

  ```ts
  const radius = css`4px`;
  css`button { border-radius: ${radius}; padding: ${8}px; }`; // fine
  css`button { color: ${userInput}; }`; // throws - use unsafeCSS() to opt in explicitly
  ```
- `unsafeCSS(value)` wraps an arbitrary value (stringified) as a trusted `CSSResult`, for the rare
  case of CSS text loaded or computed at runtime.
- Like `t`, a literal with **no interpolations** is cached (keyed by the literal's `strings`
  identity - the same object every time that exact call site runs) - calling the same zero-arg
  `css\`...\`` repeatedly returns the exact same `CSSResult`, so its `CSSStyleSheet` is only ever
  built once.

## `CSSResultGroup`

`static styles` accepts a single `CSSResult`, or a (possibly nested) array of them —
`type CSSResultGroup = CSSResult | readonly CSSResultGroup[]`. `flattenCSSResults()` /
`flattenCSSText()` walk a group into a flat `CSSStyleSheet[]` / concatenated `cssText`,
respectively — used by `ElementStyles` (see below) rather than by component authors directly.

```ts
static override styles = [sharedTokens, layoutStyles, buttonStyles];
```

## `static styles` on `UIElement`

Where the styles actually land depends on whether the component uses a shadow root
(`static shadowRootOptions`) or renders into light DOM (the default) — see
[`../../element-styles.ts`](../../element-styles.ts) for the implementation (`ElementStyles` class),
summarized here:

| Render root | Mechanism | Scoping |
|---|---|---|
| Shadow root, `adoptedStyleSheets` supported | `shadowRoot.adoptedStyleSheets = [...existing, ...sheets]` — the cached `CSSStyleSheet`s, shared by reference across every instance | The shadow boundary itself — `:host` works as normal |
| Shadow root, no `adoptedStyleSheets` support (e.g. some test DOMs) | A plain `<style>` prepended into the shadow root, one per instance | Still the shadow boundary — no extra wrapping needed |
| Light DOM (default) | One shared `<style>`/`CSSStyleSheet` adopted onto `document`, **once per custom element tag** (not per instance) | `@scope (tag-name) { ... }` — matches only this tag's elements, never leaks to unrelated markup |

### Why `@scope`, scoped by tag name, shared once

Light DOM has no shadow boundary, and a plain `Element` (as opposed to a `ShadowRoot`/`Document`)
has no `adoptedStyleSheets` at all — so there's no way to attach a *scoped, shared* stylesheet
directly to the host element itself. Two platform-level constraints shape the design:

- **Scoping without a shadow boundary** needs a selector. [`@scope (...)`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)
  is the standards-track mechanism for "these rules only match inside this selector's matches" -
  using the custom element's own **tag name** as the scope root is both the simplest selector
  available and inherently collision-free, since custom element names are globally unique (enforced
  by `customElements.define`).
- **Sharing one stylesheet across instances** needs something other than the (per-instance, no
  `adoptedStyleSheets`) host element to hold it — `document` is the only thing *every* instance of
  that tag can all point back to. `ElementStyles` tracks which tag names have already been adopted
  (a module-level `Set<string>`, `static` on the class) so the second, third, ... instance of a
  light-DOM-rendering class is a no-op here — one parse, not N.

The tradeoff accepted for this: light-DOM `static styles` *do* live in `document.adoptedStyleSheets`/
`document.head`, not inside the component's own markup. (An earlier iteration of this design
inserted an unshared, per-instance `<style>` wrapped in an un-anchored `@scope { ... }` directly
into each host element instead — never touching `document` at all, at the cost of re-parsing
identical CSS text once per instance. If that tradeoff fits your use case better than sharing,
that's a one-function change in `ElementStyles.apply()`.)

### `:host` → `:scope`

Because light DOM's `@scope` root is the matched tag name rather than a shadow host, `:host`
wouldn't mean anything there. So the same `css` literal can be authored once and used for either
shadow or light DOM, `hostSelectorsToScope()` rewrites bare `:host`/`:host(...)` to `:scope` before
wrapping light-DOM CSS text in `@scope (tag-name) { ... }` — inside that block, `:scope` matches the
scope root (the tag-name-matched elements), exactly like `:host` matches the shadow host:

```ts
const styles = css`:host { display: block; } button { color: red; }`;
// shadow DOM: used as-is, :host is native
// light DOM:  @scope (my-tag) { :scope { display: block; } button { color: red; } }
```

### Caveats

- **Cascades into nested elements, with no upper bound.** `@scope (tag-name) { ... }` has a lower
  bound (only matches inside a `tag-name` element) but no `to (...)` upper bound, so - like any
  ordinary CSS - a selector can still match descendants rendered by a *child* component's own light
  DOM. This is normal cascade behavior, not a leak outward past the tag-name boundary; it's just not
  shadow-DOM-level isolation.
- **Browser support.** `@scope` shipped in Chrome/Edge 118, Safari 17.4, Firefox 128 (all
  2023–2024). Per CSS parsing rules, an unrecognized at-rule's entire block is silently discarded -
  so on an unsupporting browser the styles simply don't apply (fail-closed, not leaked), with no
  error.
- **`adoptedStyleSheets` unsupported environments** (e.g. jsdom in tests) fall back to appending a
  plain `<style>` to `document.head` with the same `@scope`-wrapped text - same scoping guarantee,
  just via a different API.

## `ElementStyles`

One instance per `UIElement`, created alongside its render root (see `#ensureRenderRoot()` in
[`../ui-element.ts`](../ui-element.ts)). It exists to hold the one piece of *per-instance* state
styling needs to track:

- `apply(renderRoot, tagName, styles)` — does the work described in the table above, once.
- `reinsertIfRemoved(renderRoot)` — re-inserts the shadow-fallback `<style>` (the no-`adoptedStyleSheets`
  path only) if a structural re-render (`render()` clearing the render root's children) removed it.
  `render()` only clears on the *first* render of a given `template()` literal, or when it changes
  to a different one, so this is a no-op on the much more common value-only updates - and a no-op
  unconditionally for every other styling path (`adoptedStyleSheets`, light DOM), since none of
  those write anything into the render root for `render()`'s clearing to disturb.

`UIElement` calls both; it holds no styling state of its own beyond `readonly #elementStyles = new
ElementStyles()`.

## Related reading

- [`index.ts`](./index.ts) — `css`/`unsafeCSS`/`CSSResult`/`flattenCSSResults`/`flattenCSSText`/`hostSelectorsToScope`.
- [`../../element-styles.ts`](../../element-styles.ts) — `ElementStyles`, consumed by `UIElement`.
- [`../../ui-element.ts`](../../ui-element.ts) — `static styles`, `#ensureRenderRoot()`, `#requestUpdate()`.
- [`../html/html.md`](../html/html.md) — the analogous usage/design doc for `t`/`render` (the templating half
  of this same "tagged template, cached by call site" family of tricks).
- [`css.test.ts`](./css.test.ts) / [`../../element-styles.test.ts`](../../element-styles.test.ts) /
  [`../../ui-element.test.ts`](../../ui-element.test.ts) — behavior tests.
