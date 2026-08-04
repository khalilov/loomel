# loomel

Reactive HTML element factory: procedural DOM creation and manipulation without JSX
or templates. One atom — `App`, a wrapper over native `HTMLElement`.

## Install

```
npm install loomel
```

## Quick start

```ts
import { create } from 'loomel'

const meter = create('div', {
  props: { className: 'meter' },
  children: [
    create('span', { props: { textContent: 'Hunger' } }),
    create('span', {
      props: { className: 'meter-fill', style: { width: '42%' } },
    }),
  ],
})

document.body.append(meter.node)
```

## Public API

| Member                       | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `create(tag, config?)`       | Creates a reactive node `App<HTMLElementTagNameMap[Tag]>`        |
| `app.node`                   | The real `HTMLElement` — integration point with native API      |
| `app.set(props)`             | Updates properties in place                                     |
| `app.append(...children)`    | Appends children to the end                                     |
| `app.prepend(...children)`   | Prepends children to the beginning                              |
| `app.replace(...children)`   | Replaces content (`replaceChildren`)                            |
| `app.clear()`                | Drops subscriptions and clears children; node stays in DOM      |
| `app.on(type, handler)`      | Subscribes to an event; returns an unsubscribe function         |
| `app.query(sel)`             | `querySelector` shorthand — returns `Element | null`            |
| `app.queryAll(sel)`          | `querySelectorAll` shorthand — returns `NodeListOf<Element>`    |
| `app.dispose()`              | Removes all subscriptions and the element from the tree         |
| `applyProps(element, props)` | Low-level property application helper                           |

## Creation config

```ts
interface ElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]> // typed by tag
  on?: { [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void }
  children?: Child | Child[]
}
```

`props` is strictly typed: for `create('button', ...)` autocomplete and checks
work against `HTMLButtonElement`. Special cases (`style`, `dataset`) are merged
into sub-objects.

## Children

`Child = HTMLElement | App<HTMLElement> | string | number | null | false | Child[]`

- `App` resolves to its `.node`, primitives convert to text (`0` is preserved);
- `null` / `false` are convenient for conditional insertion and are filtered out
  automatically;
- nested `Child[]` are recursively flattened.

```ts
const panel = create('div', {
  children: [
    maybeTitle && create('h2', { props: { textContent: maybeTitle } }),
    create('ul', { children: items.map((item) => create('li', { props: { textContent: item } })) }),
  ],
})
```

## Lifecycle

```ts
const list = create('ul')

// as data arrives — redraw content
const redraw = (items: string[]) =>
  list.replace(...items.map((item) => create('li', { props: { textContent: item } })))

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

## Example: reactive counter

```ts
import { create } from 'loomel'

const buildCounter = (initial: number) => {
  const display = create('span', { props: { textContent: String(initial) } })

  const button = create('button', {
    props: { textContent: '+' },
    on: { click: () => display.set({ textContent: String(++count) }) },
  })

  let count = initial
  return create('div', { children: [display, button] })
}
```

## Tests

```
npm test
```
