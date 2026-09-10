# loomel

Reactive HTML/SVG element factory: procedural DOM creation and manipulation without
JSX or templates. One atom — `App`, a wrapper over a native `Element`.

## Install

```
npm install loomel
```

## Quick start

```ts
import { html } from 'loomel'

const meter = html('div', {
  props: { className: 'meter' },
  children: [
    html('span', { props: { textContent: 'Hunger' } }),
    html('span', {
      props: { className: 'meter-fill', style: { width: '42%' } },
    }),
  ],
})

document.body.append(meter.node)
```

## Chaining

Methods that update an `App` return the same instance, so calls can be chained:

```ts
const badge = html('span').style({ padding: 8, opacity: 0.8 }).text('Ready')

const panel = html('section', {
  children: [html('span', { props: { className: 'same' } })],
})

panel.find('.same')?.style({ width: 10 }).text('same')
```

Use optional chaining after `find()`: when no element matches, the rest of the
chain is skipped.

## SVG

`svg()` creates elements in the SVG namespace and applies attributes via
`setAttribute` — not via property assignment. Use `viewBox`, `d`, `fill`,
`stroke`, `stroke-width` and any other SVG attribute directly in `props`.

```ts
import { html, svg } from 'loomel'

const icon = html('span', {
  children: [
    svg('svg', {
      props: { viewBox: '0 0 24 24', fill: 'none' },
      children: [
        svg('path', {
          props: {
            d: 'M12 2v20M2 12h20',
            stroke: 'currentColor',
            'stroke-width': 2,
          },
        }),
      ],
    }),
  ],
})
```

## HTML properties vs SVG attributes

- **`html()`** assigns *properties* (`Reflect.set`), with special cases for
  `className`, `style`, `dataset`, `textContent`. This matches how HTML elements
  reflect their state.
- **`svg()`** writes *attributes* (`setAttribute`). SVG presentation attributes
  like `d`, `viewBox` or `fill` are not reflected as element properties, so they
  must go through `setAttribute`. `style` and `dataset` are still merged into
  sub-objects, `className` maps to the `class` attribute.

Both namespaces share the same `App` API: `set`, `style`, `text`, `append`, `prepend`, `replace`,
`clear`, `on`, `find`, `findAll`, `dispose`.

## Public API

| Member                       | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `html(tag, config?)`         | Creates a reactive node `App<HTMLElementTagNameMap[Tag]>`        |
| `svg(tag, config?)`          | Creates a reactive node `App<SVGElementTagNameMap[Tag]>`         |
| `app.node`                   | The real `Element` — integration point with native API           |
| `app.set(props)`             | Updates properties (HTML) / attributes (SVG) in place            |
| `app.style(props)`           | Merges styles; numbers become `px`, except zero and unitless props |
| `app.text(value)`            | Replaces text content and returns the same `App`                 |
| `app.append(...children)`    | Appends children to the end                                      |
| `app.prepend(...children)`   | Prepends children to the beginning                               |
| `app.replace(...children)`   | Replaces content (`replaceChildren`)                             |
| `app.clear()`                | Drops subscriptions and clears children; node stays in DOM       |
| `app.on(type, handler, options?)` | Subscribes with native listener options; returns an unsubscribe function |
| `app.query(sel)`             | Potentially deprecated `querySelector` shorthand                 |
| `app.queryAll(sel)`          | Potentially deprecated `querySelectorAll` shorthand              |
| `app.find(sel)`              | Wraps the first matching HTML or SVG element as an `App`         |
| `app.findAll(sel)`           | Wraps matching HTML and SVG elements as `App[]`                  |
| `app.dispose()`              | Removes all subscriptions and the element from the tree          |
| `applyProps(element, props)` | Low-level property application helper                            |

> **Deprecated:** `create()` is an alias of `html()`. Use `html()` instead.
> `create()` will be removed in the next major version.

## Creation config

```ts
interface HtmlElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]> // typed by tag
  on?: { [K in keyof GlobalEventHandlersEventMap]?: (e: GlobalEventHandlersEventMap[K]) => void }
  children?: Child | Child[]
}

interface SvgElementConfig {
  props?: SvgAttributes // attributes: string | number, plus style / dataset
  on?: { [K in keyof GlobalEventHandlersEventMap]?: (e: GlobalEventHandlersEventMap[K]) => void }
  children?: Child | Child[]
}
```

HTML `props` is strictly typed: for `html('button', ...)` autocomplete and checks
work against `HTMLButtonElement`. Special cases (`style`, `dataset`) are merged
into sub-objects. SVG `props` accepts arbitrary attribute names as `string |
number`.

## Children

`Child = Element | App<Element> | string | number | null | false | Child[]`

- `App` resolves to its `.node`, primitives convert to text (`0` is preserved);
- `null` / `false` are convenient for conditional insertion and are filtered out
  automatically;
- nested `Child[]` are recursively flattened.

HTML and SVG elements can be nested into each other wherever the DOM allows it.

```ts
const panel = html('div', {
  children: [
    maybeTitle && html('h2', { props: { textContent: maybeTitle } }),
    html('ul', { children: items.map((item) => html('li', { props: { textContent: item } })) }),
  ],
})
```

## Lifecycle

```ts
const list = html('ul')

// as data arrives — redraw content
const redraw = (items: string[]) =>
  list.replace(...items.map((item) => html('li', { props: { textContent: item } })))

redraw(['a', 'b'])
redraw(['c'])

list.clear() // subscriptions removed, children cleared, node stays in DOM
list.dispose() // subscriptions removed, element removed from DOM
```

> `dispose()` removes the element and drops subscriptions. If the node is
> re-attached to the DOM via native `append`, subscriptions must be re-added
> manually — there is no automatic restoration.

> `clear()` drops subscriptions and clears children but keeps the node in the
> tree. Useful for resetting a component without destroying it.

## Example: nested event handling

```ts
import { html } from 'loomel'

const items = ['apple', 'banana', 'cherry']

const list = html('ul', {
  children: items.map((item) =>
    html('li', {
      props: { textContent: item },
      on: { click: () => console.log(`clicked: ${item}`) },
    }),
  ),
})

document.body.append(list.node)

// dispose tears down all nested subscriptions and removes the element
list.dispose()
```

## Example: reactive counter

```ts
import { html } from 'loomel'

const buildCounter = (initial: number) => {
  const display = html('span', { props: { textContent: String(initial) } })

  const button = html('button', {
    props: { textContent: '+' },
    on: { click: () => display.set({ textContent: String(++count) }) },
  })

  let count = initial
  return html('div', { children: [display, button] })
}
```

## Tests

```
npm test
```
