---
name: loomel
description: Use when writing or editing TypeScript that imports `loomel`, calls `html()`/`svg()`/`watch()`, or builds and updates DOM with the chainable `App` API.
---

# loomel

loomel is a thin, typed procedural layer over the **native DOM**. No virtual DOM,
no components, no JSX. Stay **native**: reach for `App` methods, and drop to
`app.node` only for what `App` does not cover.

Named imports only:

```ts
import { html, svg, watch } from 'loomel'
```

## Create

```ts
const card = html('article', {
  props: { className: 'card', hidden: false },
  on: { click: open },
  children: ['Ready', badge],
})
```

- `html(tag, config?)` builds HTML; `props` are typed by tag.
- `svg(tag, config?)` builds SVG; `props` become attributes.
- `config.children` takes one `Child` or an array of them.
- **Child** = native `Element`, any `App` (matched structurally by its `node`),
  `string`, `number`, nested `Child[]`, `null`, `false`. Use `null`/`false` for
  conditional children; numeric `0` is kept.

## Update and chain

Every mutating method returns the same `App`, so calls chain:

```ts
card
  .set({ className: 'card active', hidden: false })
  .style({ width: 320, opacity: 0.9 })
  .data({ cardId: 42, ready: true })
  .text('Ready')
```

- `set()` writes HTML properties; on SVG it writes attributes.
- `style()` merges inline styles. Numbers become `px`; `0` and unitless
  properties stay unitless. Pass `%`, `rem`, `deg`, `ms` as strings.
- `text()` replaces text content.
- `data()` reads and writes `dataset`; a `null` value deletes the key.

```ts
card.data() // live DOMStringMap
card.data('cardId') // "42"
card.data('cardId', 43) // chainable setter
```

## Find

```ts
card.find('.title')?.style({ opacity: 1 }).text('Ready')
card.findAll('[data-selected]').forEach((item) => item.data('selected', null))
```

- `find()` returns `App | null`; keep `?.` on the first call.
- Both wrap matching HTML and SVG elements as `App`.

## Events and lifecycle

```ts
const off = card.on('click', save, { once: true })
off()
```

- `on()` returns an unsubscribe function.
- `connected` reports the native connection state.
- `clear()` removes the listeners registered by that `App` and clears children,
  keeping the element connected.
- `dispose()` removes those listeners and the element.
- `watch(root)` auto-removes loomel listeners from externally detached
  descendants. One watcher per independently managed DOM root.

## SVG

SVG props are attributes, not JavaScript properties:

```ts
const icon = svg('svg', {
  props: { viewBox: '0 0 24 24' },
  children: [svg('path', { props: { d: 'M2 12h20', 'stroke-width': 2 } })],
})
```

## Rules

- Named imports only; never namespace-import.
- Keep the native element behind `app.node`; reach for it only when `App` lacks
  the operation.
- Reach for the platform: native controls (`<input type="date">`), CSS, and HTML
  before adding code.
- `query()`, `queryAll()`, `create()`, and exported `apply()` are legacy — do not
  introduce them.
- Do not layer a framework, virtual DOM, JSX, or templating on top.
- Types do not prove browser behaviour; verify rendering and events in a browser.

Full API and edge cases: `node_modules/loomel/SPEC.md`.
