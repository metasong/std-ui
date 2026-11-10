# Template compiler design

The compiler turns a tagged template's `strings` into a cached, parsed `<template>` plus a list of
descriptors saying where each dynamic value landed. `instantiate()` later clones that template and
turns the descriptors into live parts.

It has two layers:

| Layer | File | Knows about |
|---|---|---|
| Generic engine | `engine.ts` | templates, text vs. attribute positions, markers, parsing, node indexing, cloning, lifecycle hooks |
| std-ui syntax | `compile.ts` | `.prop` / `?bool` / `@event.mod` / plain `attr`, `Part` classes, SVG, dev warnings |

`index.ts` is the public entry; it re-exports `getTemplate`, `instantiate` and the engine types.

## Goals

- The engine has no std-ui knowledge. It never mentions sigils, parts, events or SVG.
- Every std-ui-specific decision sits behind a hook, and the hooks are grouped by concern in `compile.ts`.
- The public API (`getTemplate`, `instantiate`, `Template`, `PartDescriptor`) stays stable.
- A new syntax or descriptor kind only touches `compile.ts`.

## Non-goals

- Unquoted attribute values (`a=${x}`, `.prop=${x}`, `@click=${h}`) are supported, lit-style: exactly one interpolation, no static text.
- Interpolation inside tag names, comments or `<script>`/`<style>` bodies is not supported.
- The engine does not render or update. That is the job of parts.

## Pipeline

```
compile(strings, type)
  scan strings, for each interpolation:
    text position       -> onTextSlot()                    -> descriptor
    tag position        -> onTagSlot()                     -> descriptor (`<div ${x}>`, no attribute name)
    attribute position  -> onAttributeOpen()               (at the opening quote)
                           more ${} in same value extend the same attribute
                           onAttributeClose()              (at the closing quote) -> descriptor
  wrapMarkup() -> innerHTML -> unwrapContent()
  walk nodes: assign descriptor.nodeIndex, strip attribute placeholders
  onCompiled()

instantiate(template)
  cloneNode(content)
  walk clone, resolve nodeIndex -> Node
  createPart(descriptor, node) for each descriptor
  onInstantiated()
```

`getTemplate` caches by `strings` identity, then by `type`.

## Scanner

A small state machine over `strings`, in the style of an HTML tokenizer's named states:

- `TEXT`: between tags. The next `${}` is a text slot, or opens an attribute if the markup so far ends inside an unclosed tag.
- `ATTR_VALUE`: inside an unclosed quoted attribute value. Each further `${}` extends the same attribute, so `class="${a} ${b}"` can span any number of interpolations.

Transitions:

- `TEXT -> ATTR_VALUE` on seeing `name="`.
- `ATTR_VALUE -> TEXT` on the matching closing quote. The interpolation that followed the closing quote is then re-evaluated as `TEXT`.

The engine tracks `quote`, `literals` and `valueCount` itself. The hooks only see them at open and close.

### Markers

- Text slot: a real comment node `<!--std-ui-part-->`, kept in the DOM as an anchor.
- Tag slot: an injected attribute `std-ui-part-tag-N` valued with the marker (unique per element, since the parser drops duplicate attributes), stripped like attribute slots.
- Attribute slot: an attribute whose value is the placeholder `std-ui-part`. After parsing, the engine records its `nodeIndex` and removes it. The real value is recomputed from `literals` and live values on first update, so one placeholder works for one or many interpolations.
- Static text before the first interpolation (the `static-` in `class="static-${x}"`) is rewound out of the markup, because it is already stored in `literals[0]`.

### Node indexing

Descriptors are in source order, and the walk visits element and comment nodes in document order. So the *n*-th marker found corresponds to the *n*-th descriptor. `nodeIndex` is the node's position in that walk. Clones are walked the same way, which makes the lookup independent of the original DOM.

## Hooks

```ts
interface EngineHooks<D, Part, Type, Open> {
  onTextSlot(ctx): DescriptorInit<D>
  onTagSlot?(ctx): DescriptorInit<D>
  onAttributeOpen(ctx): Open
  onAttributeClose(open, ctx): DescriptorInit<D>

  wrapMarkup?(markup, type): string
  unwrapContent?(content, type): void
  onCompiled?(template, type): void

  createPart(descriptor, node): Part
  onInstantiated?(fragment, parts): void
}
```

- `D` is the descriptor type. It must extend `{ nodeIndex, valueCount }`; the engine sets `nodeIndex`.
- `Open` is private state the syntax layer carries from open to close, for example the parsed sigil and name.
- `Type` is a free string union (`'html' | 'svg'` here). The engine only uses it as a cache key and passes it to hooks.
- Hooks throw to reject invalid templates. The engine adds no validation of its own beyond "could not parse" and "unterminated attribute value".

## How std-ui plugs in (`compile.ts`)

| Concern | Hook(s) |
|---|---|
| Binding syntax | `onAttributeOpen` parses `[sigil]name[.modifiers]`; `onAttributeClose` enforces that `.`/`?`/`@` bindings take exactly one interpolation and no static text |
| Child content | `onTextSlot` returns a `child` descriptor |
| Element slot | `onTagSlot` returns an `element` descriptor; `ElementPart` only accepts directives (e.g. `ref`) |
| Part creation | `createPart` maps descriptor `kind` to `ChildPart`, `AttributePart`, `BooleanAttributePart`, `PropertyPart` or `EventPart` |
| SVG | `wrapMarkup` wraps in `<svg>`, `unwrapContent` hoists the children back so indices match the HTML path |
| Dev diagnostics | `onCompiled` calls `warnOnUndefinedElements` in DEV |

`compile.ts` imports `parts/`, and `parts/` imports `instantiate` for nested templates. The cycle is harmless because the part classes are only used lazily inside `createPart`.

## Extending

- **New sigil, for example `:name`:** add it to `SIGIL_KIND`, extend `BINDING_NAME_RE`, add a part kind and a `createPart` case.
- **New slot behaviour, for example a directive-style attribute:** another `PartKind`, handled in `describeBinding` and `createPart`.
- **A second, unrelated syntax:** call `createEngine` with different hooks. The cache and scanner are per engine.

## Behaviour notes

- The engine's attribute-name regex is permissive (`[^\s"'<>/=]+`). The std-ui layer validates the name and throws `could not parse an attribute binding` for anything it does not accept.
- Descriptors are flat objects, so `template.parts[i].kind`, `name`, `literals` and `options` keep working for tests and parts.

See also: [compile-attributes.md](./compile-attributes.md), [html.md](../html.md).
