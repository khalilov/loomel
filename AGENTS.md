# loomel agent guide

Use loomel as a thin typed layer over the native DOM. Keep code procedural,
chainable, and boring. There is no virtual DOM hiding behind the curtain.

## Start here

```ts
import { html, svg, watch } from 'loomel'
```

- Use `html()` for HTML and `svg()` for SVG.
- Use named imports only.
- Keep the native element behind `app.node`; reach for it only when `App` does
  not already cover the operation.
- Mutating methods return the same `App`, so chain them.

```ts
const card = html('article')
  .set({ className: 'card', hidden: false })
  .style({ width: 320, opacity: 0.9 })
  .data({ cardId: 42, ready: true })
  .text('Ready')
```

## Creation

Pass initial properties, listeners, and children in the config.

```ts
const button = html('button', {
  props: { type: 'button', className: 'save' },
  on: { click: save },
  children: ['Save'],
})
```

`Child` accepts native elements, `App`, strings, numbers, nested arrays,
`null`, and `false`. Use `null` or `false` for conditional children.

## Updates

- `set(props)` updates HTML properties or SVG attributes.
- `style(props)` merges inline styles. Numeric lengths become `px`; zero and
  unitless properties stay unitless. Write `%`, `rem`, `deg`, and `ms` as strings.
- `text(value)` replaces text content. `set({ textContent })` is still valid.
- `data()` returns the live dataset.
- `data(key)` reads one value.
- `data(key, value)` writes one value; `null` deletes it.
- `data(values)` writes or deletes several values.

Dataset keys use camelCase:

```ts
card.data('buildingReady') // data-building-ready
card.data('buildingReady', true).data('buildingId', 42)
card.data({ selected: false, obsolete: null })
```

## Search

Use `find()` and `findAll()`. They wrap matching HTML and SVG elements as
`App` instances.

```ts
card.find('.title')?.style({ opacity: 1 }).text('Ready')
card.findAll('[data-selected]').forEach((item) => item.data('selected', null))
```

`find()` returns `null`; keep optional chaining on the first mutating call.

Do not introduce new uses of `query()`, `queryAll()`, `create()`, or exported
`apply()`. They remain only for compatibility.

## Events and lifecycle

`on()` accepts native listener options and returns an unsubscribe function.

```ts
const off = button.on('click', save, { once: true })
off()
```

- `clear()` removes listeners registered by that `App` and clears its children,
  but keeps the element connected.
- `dispose()` removes those listeners and the element.
- `connected` reports the native connection state.
- `watch(root)` automatically removes loomel listeners from externally detached
  descendants. Start one watcher per independently managed DOM root.

```ts
const stop = watch(document.body)
stop()
```

Do not call `watch()` for every `App`.

## SVG

SVG props are attributes, not JavaScript properties.

```ts
const icon = svg('svg', {
  props: { viewBox: '0 0 24 24' },
  children: [svg('path', { props: { d: 'M2 12h20', 'stroke-width': 2 } })],
})
```

## Before handing work back

```sh
npm run check
npm run pack:check
```

Keep changes minimal, update README and SPEC when the public contract changes,
and never claim browser behavior from typecheck alone.
