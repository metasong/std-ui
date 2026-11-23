# Template factory design

The factory turns a tagged template's `strings` into a cached, parsed `<template>` plus a list of
descriptors saying where each dynamic value landed. `instantiate()` later clones that template and
turns the descriptors into live parts.

It has two layers:

| Layer | File | Knows about |
|---|---|---|
| Generic Builder | `builder.ts` | templates, text vs. attribute positions, markers, parsing, node indexing, cloning, lifecycle hooks |
| std-ui syntax | `factory.ts` | `.prop` / `?bool` / `@event.mod` / plain `attr`, `Part` classes, SVG, dev warnings |

`index.ts` is the public entry; it re-exports `getTemplate`, `instantiate` and the Builder types.

## Goals

- The Builder has no std-ui knowledge. It never mentions sigils, parts, events or SVG.
- Every std-ui-specific decision sits behind a hook, and the hooks are grouped by concern in `factory.ts`.
- The public API (`getTemplate`, `instantiate`, `Template`, `PartDescriptor`) stays stable.
- A new syntax or descriptor kind only touches `factory.ts`.

## Non-goals

- Unquoted attribute values (`a=${x}`, `.prop=${x}`, `@click=${h}`) are supported: exactly one interpolation, no static text.
- Interpolation inside tag names or HTML comments is not supported.
- `<title>`/`<textarea>`/`<style>`/`<script>` bodies are text, not markup: they are bound as one string (see "Raw-text bodies").
- The Builder does not render or update. That is the job of parts.

## Pipeline

```
build(strings, type)
  scan strings, for each interpolation:
    text position       -> onTextSlot()                    -> descriptor
    tag position        -> onTagSlot()                     -> descriptor (`<div ${x}>`, no attribute name)
    attribute position  -> onAttributeOpen()               (at the opening quote)
                           more ${} in same value extend the same attribute
                           onAttributeClose()              (at the closing quote) -> descriptor
  wrapMarkup() -> innerHTML -> unwrapContent()
  walk nodes: assign descriptor.nodeIndex, strip attribute placeholders
  onBuilt()

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
- `RAW_BODY`: inside a `<title>`/`<textarea>`/`<style>`/`<script>` body of HTML content. Each further `${}` extends the same body until the closing tag.

Transitions:

- `TEXT -> RAW_BODY` on the first `${}` after such an opening tag; `RAW_BODY -> TEXT` at `</tag`.
- `TEXT -> ATTR_VALUE` on seeing `name="`.
- `ATTR_VALUE -> TEXT` on the matching closing quote. The interpolation that followed the closing quote is then re-evaluated as `TEXT`.

The Builder tracks `quote`, `literals` and `valueCount` itself. The hooks only see them at open and close.

### Markers

- Text slot: a real comment node `<!--std-ui-part-->`, kept in the DOM as an anchor.
- Tag slot: an injected attribute `std-ui-part-tag-N` valued with the marker (unique per element, since the parser drops duplicate attributes), stripped like attribute slots.
- Attribute slot: an attribute whose value is the placeholder `std-ui-part`. After parsing, the Builder records its `nodeIndex` and removes it. The real value is recomputed from `literals` and live values on first update, so one placeholder works for one or many interpolations.
- Static text before the first interpolation (the `static-` in `class="static-${x}"`) is rewound out of the markup, because it is already stored in `literals[0]`.

### Raw-text bodies

**Problem.** The HTML parser turns the body of `<title>`, `<textarea>`, `<style>` and `<script>` into a single text node. A marker comment (`<!--std-ui-part-->`) placed there would become literal text, so a `ChildPart` could never find its anchor.

**Idea.** The body is only text, so all its interpolations are joined with the static text into one string and set as the element's `textContent`. That is one part for the whole body, found through the element itself, not through a comment.

**Where it lives.** Detection and body collection are in `raw-text.ts` (pure functions, unit-tested directly). The scanner only switches state and calls a hook. `factory.ts` builds the descriptor and part. The generic Builder stays unaware of `title` or `textarea`.

#### Walkthrough

```ts
t`<title>abc ${a} dsd ${b}sdd</title><p>${c}</p>`
// strings: ['<title>abc ', ' dsd ', 'sdd</title><p>', '</p>']
```

| Step | Scanner state | What happens |
|---|---|---|
| 1. `${a}` | `TEXT` | `stepText` sees `openRawTextElement(markup)` = `<title>` (not in a comment, not in `<svg>`/`<math>`, template not foreign). `beginRawBody` makes `literals = ['abc ']`. The markup is rewound to before the tag's `>`, and ` std-ui-part-tag-0="std-ui-part">` is appended: `<title std-ui-part-tag-0="std-ui-part">`. State becomes `RAW_BODY`. |
| 2. `${b}` | `RAW_BODY` | `feedRawBody` gets `' dsd '`. There is no closing `</title`, so it is added to `literals` and `valueCount` becomes 2. Nothing is appended to the markup. |
| 3. chunk `'sdd</title><p>'` | `RAW_BODY` -> `TEXT` | `feedRawBody` finds `</title`, so `literals = ['abc ', ' dsd ', 'sdd']`. `stepRawBody` calls `onRawTextBody` and pushes the descriptor. The rest of the chunk (`</title><p>`) is appended and scanning continues as `TEXT`. `${c}` becomes a normal text slot. |

Result of the example:

```ts
// Scanner output
markup:
  `<title std-ui-part-tag-0="std-ui-part"></title><p><!--std-ui-part--></p>`
  //  ^ placeholder attribute marks the element; the body text is gone (rebuilt at render)

descriptors: [
  { kind: RAW_TEXT_KIND,            // 3: one descriptor for the whole body
    name: '',
    valueCount: 2,                  // consumes values[0] (a) and values[1] (b)
    literals: ['abc ', ' dsd ', 'sdd'], // valueCount + 1 static segments, raw HTML text
    nodeIndex: -1 },                // set by resolveIndices (see below)
  { kind: PartType.CHILD,           // `${c}` is an ordinary text slot
    name: '',
    valueCount: 1,
    nodeIndex: -1 },
]

// After resolveIndices (elements and comments in document order: <title>=0, <p>=1, comment=2)
descriptors[0].nodeIndex === 0      // the <title> element itself; placeholder attribute removed
descriptors[1].nodeIndex === 2      // the comment anchor inside <p>

// At render, with values (a, b, c) = ('A', 2, 'C'): RawTextPart consumes 2 values, ChildPart 1
title.textContent === 'abc A dsd 2sdd'   // literals[0] + 'A' + literals[1] + '2' + literals[2]
```

After parsing, `resolveIndices` finds the placeholder attribute and records the element's `nodeIndex`, like for a tag slot. Descriptors stay in document order because nothing else can start inside the body.

**At render.** `createPart` sees `kind === RAW_TEXT_KIND` and builds a `RawTextPart(el, literals, valueCount)`. On `update(values)` it joins `literals[0] + str(v0) + literals[1] + str(v1) + ...`, where `null`/`undefined` become `''`. It skips the DOM write when the string is unchanged, otherwise it sets `textContent`. For `title`/`textarea` the part decodes character references (`&amp;`) in the static text once, in its constructor, because those bodies are RCDATA. `style`/`script` text is verbatim.

#### Rules and limits

- **Foreign content is excluded.** In `svg`/`math` templates (`foreignTypes`) and inside an unclosed `<svg>`/`<math>` these tags hold normal markup, so `openRawTextElement` returns `null` and slots work as usual. Inside `<foreignObject>` the content is HTML again, but this is not detected.
- **Values are plain text.** They are set through `textContent`, never parsed. Directives throw (`RawTextPart` checks `isDirectiveResult`).
- **`<script>` stays inert.** A script cloned from a template never runs, so use it for data (`application/json`).
- **Comments are not bindable.** `insideComment` makes the scanner throw a clear error.
- **No hook, no support.** Without `onRawTextBody`, the scanner throws `unsupportedContextError` for these elements, as for comments.
- **Unterminated body.** If the template ends before the closing tag, the scanner throws `unterminated <tag>`.

### Node indexing

Descriptors are in source order, and the walk visits element and comment nodes in document order. So the *n*-th marker found corresponds to the *n*-th descriptor. `nodeIndex` is the node's position in that walk. Clones are walked the same way, which makes the lookup independent of the original DOM.

## Hooks

```ts
interface BuilderHooks<D, Part, Type, Open> {
  onTextSlot(ctx): DescriptorInit<D>
  onTagSlot?(ctx): DescriptorInit<D>
  onAttributeOpen(ctx): Open
  onAttributeClose(open, ctx): DescriptorInit<D>
  onRawTextBody?(ctx): DescriptorInit<D>

  wrapMarkup?(markup, type): string
  unwrapContent?(content, type): void
  onBuilt?(template, type): void

  createPart(descriptor, node): Part
  onInstantiated?(fragment, parts): void
}
```

- `D` is the descriptor type. It must extend `{ nodeIndex, valueCount }`; the Builder sets `nodeIndex`.
- `Open` is private state the syntax layer carries from open to close, for example the parsed sigil and name.
- `Type` is a free string union (`'html' | 'svg'` here). The Builder only uses it as a cache key and passes it to hooks.
- Hooks throw to reject invalid templates. The Builder adds no validation of its own beyond "could not parse" and "unterminated attribute value".

## How std-ui plugs in (`factory.ts`)

| Concern | Hook(s) |
|---|---|
| Binding syntax | `onAttributeOpen` parses `[sigil]name[.modifiers]`; `onAttributeClose` enforces that `.`/`?`/`@` bindings take exactly one interpolation and no static text |
| Child content | `onTextSlot` returns a `child` descriptor |
| Element slot | `onTagSlot` returns an `element` descriptor; `ElementPart` only accepts directives (e.g. `ref`) |
| Text-only bodies | `onRawTextBody` returns a `RAW_TEXT_KIND` descriptor; `createPart` builds a `RawTextPart` |
| Part creation | `createPart` maps descriptor `kind` to `ChildPart`, `AttributePart`, `BooleanAttributePart`, `PropertyPart` or `EventPart` |
| SVG | `wrapMarkup` wraps in `<svg>`, `unwrapContent` hoists the children back so indices match the HTML path |
| Dev diagnostics | `onBuilt` calls `warnOnUndefinedElements` in DEV |

`factory.ts` imports `parts/`, and `parts/` imports `instantiate` for nested templates. The cycle is harmless because the part classes are only used lazily inside `createPart`.

## Extending

- **New sigil, for example `:name`:** add it to `SIGIL_KIND`, extend `BINDING_NAME_RE`, add a part kind and a `createPart` case.
- **New slot behaviour, for example a directive-style attribute:** another `PartKind`, handled in `describeBinding` and `createPart`.
- **A second, unrelated syntax:** call `createBuilder` with different hooks. The cache and scanner are per Builder.

## Behaviour notes

- The Builder's attribute-name regex is permissive (`[^\s"'<>/=]+`). The std-ui layer validates the name and throws `could not parse an attribute binding` for anything it does not accept.
- Descriptors are flat objects, so `template.parts[i].kind`, `name`, `literals` and `modifiers` keep working for tests and parts.

See also: [attributes.md](./attributes.md), [html.md](../tag-funcs/html/html.md).
