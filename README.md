# loomel

Procedural HTML/SVG without JSX or templates. `html()` and `svg()` return a
small `App` wrapper with chainable updates. The DOM you already know, now with autocomplete and chaining — no framework
buy-in, component ceremony, or JSX just to create one innocent `<div>`.

**2.1 kB gzipped** for the complete ESM build. Small enough to need a magnifying
glass in the bundle analyzer, light enough to fly through lousy mobile data.

> 🤖 Coding agent? Read the [agent guide](https://github.com/khalilov/loomel/blob/main/AGENTS.md).
> Need every edge case? Open the [full specification](https://github.com/khalilov/loomel/blob/main/SPEC.md).

## Install

```sh
npm install loomel
```

## Create

```ts
import { html, watch } from 'loomel'

let value = 0

const counter = html('section', {
  props: { className: 'counter' },
  children: [
    html('strong', { props: { className: 'value' } }).text(value),
    html('button', {
      props: { type: 'button' },
      on: { click: () => counter.find('.value')?.text(++value) },
      children: ['Increment'],
    }),
  ],
})

document.body.append(counter.node)
watch(document.body)
```

HTML props are typed by tag. Children accept native elements, `App` instances,
strings, numbers, nested arrays, `null`, and `false`.

## Update and chain

```ts
counter
  .set({ className: 'counter active', hidden: false })
  .style({ width: 240, opacity: 0.9 })
  .data('counterId', 42)
  .data({ ready: true, obsolete: null })

counter.find('.value')?.style({ color: 'tomato' }).text(value)
```

- `set()` updates HTML properties or SVG attributes.
- `style()` merges styles. Numbers become `px`, except zero and unitless properties.
- `text()` replaces text content.
- `data()` reads and updates `dataset`; `null` deletes a key.

```ts
counter.data() // live DOMStringMap
counter.data('counterId') // "42"
counter.data('counterId', 43) // chainable setter
```

## Find descendants

```ts
const valueNode = counter.find('.value')
const buttons = counter.findAll('button')

valueNode?.text('Ready')
buttons.forEach((button) => button.data('ready', true))
```

`find()` returns `null` when nothing matches, so use optional chaining. Both
methods wrap matching HTML and SVG elements as `App` instances. No match, no
drama, no `Cannot read properties of null`.

## SVG

```ts
import { svg } from 'loomel'

const icon = svg('svg', {
  props: { viewBox: '0 0 24 24', fill: 'none' },
  children: [
    svg('path', {
      props: { d: 'M12 2v20M2 12h20', stroke: 'currentColor', 'stroke-width': 2 },
    }),
  ],
})
```

`html()` writes properties; `svg()` writes attributes through `setAttribute`.
Both use the same chainable `App` API.

## Events and lifecycle

```ts
const off = counter.on('click', handleClick, { passive: true })

counter.connected // true while attached to the document
off() // remove this listener
counter.clear() // remove listeners and children; keep the element
counter.dispose() // remove listeners and the element
```

`watch(root)` automatically removes loomel listeners from externally detached
elements and returns a function that stops observation. Use `app.node` when
direct DOM access is needed.

## Development

```sh
npm test
npm run typecheck
npm run build
npm run pack:check
```
